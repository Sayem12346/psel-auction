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
        auction.status = 'processing';
        await auction.save();
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
        // Only deduct final bid amount ONCE
        winner.availableCoins = winner.totalCoins - (winner.team.length > 0 ?
          (await Player.find({ _id: { $in: winner.team }, status: 'sold' })).reduce((sum, p) => sum + p.soldPrice, 0) + auction.currentBid :
          auction.currentBid);
        winner.reservedCoins = 0;
        winner.team.push(auction.currentPlayer);
        await winner.save();
      }
      await Player.findByIdAndUpdate(auction.currentPlayer, {
        status: 'sold',
        soldTo: auction.currentLeaderName,
        soldPrice: auction.currentBid
      });
      io.emit('playerSold', { winner: auction.currentLeaderName, amount: auction.currentBid, player });
    } else {
      if (!auction.unsoldQueue.map(id => id.toString()).includes(auction.currentPlayer.toString())) {
        auction.unsoldQueue.push(auction.currentPlayer);
      }
      await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' });
      await auction.save();
      io.emit('playerUnsold', { player });
    }

    setTimeout(async () => {
      await loadNextPlayer(io, auctionId);
    }, 3500);
  } catch (err) { console.log('End error:', err.message); }
}

async function loadNextPlayer(io, auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) return;

    let nextPlayerId = null;

    while (auction.availableQueue.length > 0) {
      const candidateId = auction.availableQueue.shift();
      const candidate = await Player.findById(candidateId);
      if (candidate && candidate.status === 'available') {
        nextPlayerId = candidateId;
        break;
      }
    }

    if (!nextPlayerId && auction.unsoldQueue.length > 0) {
      auction.phase = 'unsold';
      nextPlayerId = auction.unsoldQueue.shift();
    }

    if (nextPlayerId) {
      const nextPlayer = await Player.findById(nextPlayerId);
      if (!nextPlayer) { await auction.save(); return loadNextPlayer(io, auctionId); }

      auction.currentPlayer = nextPlayerId;
      auction.currentBid = nextPlayer.basePrice;
      auction.currentLeader = null;
      auction.currentLeaderName = '';
      auction.timer = 30;
      auction.status = 'running';
      auction.bidHistory = [];
      await auction.save();

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

        const allAvailable = await Player.find({ status: 'available' });
        const availableQueue = allAvailable
          .filter(p => p._id.toString() !== playerId)
          .map(p => p._id);

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
          player,
          currentBid: player.basePrice,
          timer: 30,
          currentLeader: '',
          bidHistory: []
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
        const auction = await Auction.findOneAndUpdate(
          { status: 'paused' },
          { status: 'running' },
          { new: true }
        );
        if (auction) {
          io.emit('auctionResumed', {});
          startTimer(io, auction._id);
        }
      } catch (err) {}
    });

    socket.on('skipPlayer', async () => {
      try {
        clearTimer();
        const auction = await Auction.findOne({ status: { $in: ['running', 'paused'] } });
        if (!auction) return;

        const player = await Player.findByIdAndUpdate(
          auction.currentPlayer,
          { status: 'unsold' },
          { new: true }
        );

        if (!auction.unsoldQueue.map(id => id.toString()).includes(auction.currentPlayer.toString())) {
          auction.unsoldQueue.push(auction.currentPlayer);
        }
        auction.status = 'processing';
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
          socket.emit('bidError', { message: 'Team is full! Max ' + maxPlayers + ' players.' });
          return;
        }

        // Calculate actual available coins (total - already spent on team)
        const teamPlayers = await Player.find({ _id: { $in: owner.team }, status: 'sold' });
        const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
        const actualAvailable = owner.totalCoins - totalSpent;

        if (actualAvailable < amount) {
          socket.emit('bidError', { message: 'Insufficient coins! Available: ' + actualAvailable });
          return;
        }

        // Release previous leader's reservation
        if (auction.currentLeader && auction.currentLeader.toString() !== ownerId) {
          const prev = await Owner.findById(auction.currentLeader);
          if (prev) {
            const prevTeamPlayers = await Player.find({ _id: { $in: prev.team }, status: 'sold' });
            const prevSpent = prevTeamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            prev.availableCoins = prev.totalCoins - prevSpent;
            prev.reservedCoins = 0;
            await prev.save();
          }
        }

        // Update current bidder
        owner.reservedCoins = amount;
        owner.availableCoins = actualAvailable - amount;
        await owner.save();

        auction.currentBid = amount;
        auction.currentLeader = ownerId;
        auction.currentLeaderName = owner.name;
        if (auction.timer < 8) auction.timer = 8;
        auction.bidHistory.push({ owner: ownerId, ownerName: owner.name, amount });
        await auction.save();

        io.emit('bidUpdated', {
          currentBid: amount,
          currentLeader: owner.name,
          timer: auction.timer
        });
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

  // Recover on server restart
  setTimeout(async () => {
    try {
      const auction = await Auction.findOne({ status: 'running' });
      if (auction) {
        console.log('Recovering running auction...');
        startTimer(io, auction._id);
      }
    } catch (err) {}
  }, 2000);
};
