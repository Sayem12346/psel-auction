const Auction = require('../models/Auction');
const Owner = require('../models/Owner');
const Player = require('../models/Player');

let timerInterval = null;

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

async function startTimer(io, auctionId) {
  clearTimer();
  timerInterval = setInterval(async () => {
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction) { clearTimer(); return; }
      if (auction.status === 'paused') return;
      if (auction.status !== 'running') { clearTimer(); return; }
      auction.timer -= 1;
      await auction.save();
      io.emit('timerUpdate', { timer: auction.timer });
      if (auction.timer <= 0) {
        clearTimer();
        await handleAuctionEnd(io, auctionId);
      }
    } catch (err) { console.log('Timer error:', err.message); }
  }, 1000);
}

async function handleAuctionEnd(io, auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) return;
    const player = await Player.findById(auction.currentPlayer);

    if (auction.currentLeader) {
      const winner = await Owner.findById(auction.currentLeader);
      if (winner) {
        winner.reservedCoins = 0;
        winner.availableCoins = Math.max(0, winner.availableCoins);
        winner.team.push(auction.currentPlayer);
        await winner.save();
      }
      await Player.findByIdAndUpdate(auction.currentPlayer, {
        status: 'sold', soldTo: auction.currentLeaderName, soldPrice: auction.currentBid
      });
      io.emit('playerSold', { winner: auction.currentLeaderName, amount: auction.currentBid, player });
    } else {
      const alreadyIn = auction.unsoldQueue.some(id => id.toString() === auction.currentPlayer.toString());
      if (!alreadyIn) auction.unsoldQueue.push(auction.currentPlayer);
      await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' });
      await auction.save();
      io.emit('playerUnsold', { player });
    }

    auction.status = 'transitioning';
    await auction.save();

    setTimeout(async () => {
      await loadNextPlayer(io, auctionId);
    }, 3500);
  } catch (err) { console.log('End error:', err.message); }
}

async function loadNextPlayer(io, auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) return;

    console.log('loadNextPlayer - availableQueue:', auction.availableQueue.length, 'unsoldQueue:', auction.unsoldQueue.length);

    let nextPlayer = null;

    // Phase 1: available players
    while (auction.availableQueue.length > 0 && !nextPlayer) {
      const nextId = auction.availableQueue.shift();
      const p = await Player.findById(nextId);
      if (p && p.status === 'available') {
        nextPlayer = p;
      }
    }

    // Phase 2: unsold players
    if (!nextPlayer && auction.unsoldQueue.length > 0) {
      auction.phase = 'unsold';
      while (auction.unsoldQueue.length > 0 && !nextPlayer) {
        const nextId = auction.unsoldQueue.shift();
        const p = await Player.findById(nextId);
        if (p) nextPlayer = p;
      }
    }

    if (nextPlayer) {
      auction.currentPlayer = nextPlayer._id;
      auction.currentBid = nextPlayer.basePrice;
      auction.currentLeader = null;
      auction.currentLeaderName = '';
      auction.timer = 30;
      auction.status = 'running';
      auction.bidHistory = [];
      await auction.save();

      console.log('Next player loaded:', nextPlayer.name);

      io.emit('auctionStarted', {
        player: nextPlayer,
        currentBid: nextPlayer.basePrice,
        timer: 30,
        currentLeader: '',
        bidHistory: []
      });
      startTimer(io, auction._id);
    } else {
      auction.status = 'ended';
      await auction.save();
      console.log('Auction ended - no more players');
      io.emit('auctionEnded', {});
    }
  } catch (err) { console.log('Next error:', err.message); }
}

module.exports = (io) => {
  io.on('connection', async (socket) => {

    socket.on('joinAuction', async () => {
      socket.join('auction');
      try {
        const auction = await Auction.findOne({ status: { $in: ['running', 'paused'] } }).populate('currentPlayer');
        if (auction && auction.currentPlayer) {
          socket.emit('auctionStarted', {
            player: auction.currentPlayer,
            currentBid: auction.currentBid,
            timer: auction.timer,
            currentLeader: auction.currentLeaderName || '',
            bidHistory: auction.bidHistory || []
          });
        }
      } catch (err) {}
    });

    socket.on('startAuction', async ({ playerId, maxPlayers }) => {
      try {
        clearTimer();
        await Auction.deleteMany({});

        const player = await Player.findById(playerId);
        if (!player) return;

        const allAvailable = await Player.find({ status: 'available', _id: { $ne: playerId } });
        const availableQueue = allAvailable.map(p => p._id);

        console.log('Starting auction. First player:', player.name, 'Queue:', availableQueue.length);

        const auction = await Auction.create({
          currentPlayer: playerId,
          currentBid: player.basePrice,
          status: 'running',
          timer: 30,
          availableQueue,
          unsoldQueue: [],
          phase: 'available',
          maxPlayersPerTeam: maxPlayers || 5
        });

        io.emit('auctionStarted', {
          player, currentBid: player.basePrice, timer: 30, currentLeader: '', bidHistory: []
        });
        startTimer(io, auction._id);
      } catch (err) { console.log('Start error:', err.message); }
    });

    socket.on('pauseAuction', async () => {
      try {
        clearTimer();
        await Auction.findOneAndUpdate({ status: 'running' }, { status: 'paused' });
        io.emit('auctionPaused', {});
      } catch (err) {}
    });

    socket.on('resumeAuction', async () => {
      try {
        const auction = await Auction.findOneAndUpdate({ status: 'paused' }, { status: 'running' }, { new: true });
        if (auction) { io.emit('auctionResumed', {}); startTimer(io, auction._id); }
      } catch (err) {}
    });

    socket.on('skipPlayer', async () => {
      try {
        clearTimer();
        const auction = await Auction.findOne({ status: { $in: ['running', 'paused'] } });
        if (!auction) return;
        const player = await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' }, { new: true });
        const alreadyIn = auction.unsoldQueue.some(id => id.toString() === auction.currentPlayer.toString());
        if (!alreadyIn) auction.unsoldQueue.push(auction.currentPlayer);
        auction.status = 'transitioning';
        await auction.save();
        io.emit('playerUnsold', { player });
        setTimeout(async () => { await loadNextPlayer(io, auction._id); }, 3500);
      } catch (err) { console.log('Skip error:', err.message); }
    });

    socket.on('placeBid', async ({ ownerId, amount }) => {
      try {
        const auction = await Auction.findOne({ status: 'running' });
        if (!auction) { socket.emit('bidError', { message: 'No active auction!' }); return; }
        if (amount <= auction.currentBid) { socket.emit('bidError', { message: 'Bid must be higher!' }); return; }

        const owner = await Owner.findById(ownerId).populate('team');
        if (!owner) return;

        const maxPlayers = auction.maxPlayersPerTeam || 5;
        if (owner.team.length >= maxPlayers) {
          socket.emit('bidError', { message: 'Team full! Max ' + maxPlayers + ' players.' });
          return;
        }

        if (owner.availableCoins < amount) {
          socket.emit('bidError', { message: 'Insufficient coins! Available: ' + owner.availableCoins });
          return;
        }

        // Release previous leader
        if (auction.currentLeader && auction.currentLeader.toString() !== ownerId) {
          const prev = await Owner.findById(auction.currentLeader);
          if (prev) {
            prev.availableCoins += auction.currentBid;
            prev.reservedCoins = Math.max(0, prev.reservedCoins - auction.currentBid);
            await prev.save();
          }
        }

        // Update current bidder
        if (!auction.currentLeader || auction.currentLeader.toString() !== ownerId) {
          owner.availableCoins -= amount;
          owner.reservedCoins += amount;
        } else {
          const diff = amount - auction.currentBid;
          owner.availableCoins -= diff;
          owner.reservedCoins += diff;
        }
        await owner.save();

        auction.currentBid = amount;
        auction.currentLeader = ownerId;
        auction.currentLeaderName = owner.name;
        if (auction.timer < 8) auction.timer = 8;
        auction.bidHistory.push({ owner: ownerId, ownerName: owner.name, amount });
        await auction.save();

        io.emit('bidUpdated', { currentBid: amount, currentLeader: owner.name, timer: auction.timer });
      } catch (err) { console.log('Bid error:', err.message); }
    });

    socket.on('closeAuction', async () => {
      try {
        clearTimer();
        await Auction.updateMany({}, { status: 'ended' });
        io.emit('auctionEnded', {});
      } catch (err) {}
    });
  });

  setTimeout(async () => {
    try {
      const auction = await Auction.findOne({ status: 'running' });
      if (auction) { console.log('Recovering auction...'); startTimer(io, auction._id); }
    } catch (err) {}
  }, 2000);
};
