const Auction = require('../models/Auction');
const Owner = require('../models/Owner');
const Player = require('../models/Player');

let timerInterval = null;

async function startTimer(io, auctionId) {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  timerInterval = setInterval(async () => {
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction) { clearInterval(timerInterval); timerInterval = null; return; }
      if (auction.status === 'paused') return;
      if (auction.status !== 'running') { clearInterval(timerInterval); timerInterval = null; return; }
      auction.timer = auction.timer - 1;
      await auction.save();
      io.emit('timerUpdate', { timer: auction.timer });
      if (auction.timer <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
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
        winner.availableCoins = Math.max(0, winner.availableCoins - auction.currentBid);
        winner.reservedCoins = Math.max(0, winner.reservedCoins - auction.currentBid);
        winner.team.push(auction.currentPlayer);
        await winner.save();
      }
      await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'sold', soldTo: auction.currentLeaderName, soldPrice: auction.currentBid });
      io.emit('playerSold', { winner: auction.currentLeaderName, amount: auction.currentBid, player });
    } else {
      if (!auction.unsoldQueue.map(id => id.toString()).includes(auction.currentPlayer.toString())) {
        auction.unsoldQueue.push(auction.currentPlayer);
      }
      await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' });
      await auction.save();
      io.emit('playerUnsold', { player });
    }
    auction.status = 'transitioning';
    await auction.save();
    setTimeout(async () => { await loadNextPlayer(io, auctionId); }, 3500);
  } catch (err) { console.log('End error:', err.message); }
}

async function loadNextPlayer(io, auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) return;
    let nextPlayerId = null;
    if (auction.availableQueue && auction.availableQueue.length > 0) {
      nextPlayerId = auction.availableQueue.shift();
      const p = await Player.findById(nextPlayerId);
      if (!p || p.status !== 'available') { await auction.save(); return loadNextPlayer(io, auctionId); }
    } else if (auction.unsoldQueue && auction.unsoldQueue.length > 0) {
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
      io.emit('auctionStarted', { player: nextPlayer, currentBid: nextPlayer.basePrice, timer: 30, currentLeader: '', bidHistory: [] });
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
          socket.emit('auctionStarted', { player: auction.currentPlayer, currentBid: auction.currentBid, timer: auction.timer, currentLeader: auction.currentLeaderName || '', bidHistory: auction.bidHistory || [] });
        }
      } catch (err) {}
    });

    socket.on('startAuction', async ({ playerId, maxPlayers }) => {
      try {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        await Auction.deleteMany({});
        const player = await Player.findById(playerId);
        if (!player) return;
        const allAvailable = await Player.find({ status: 'available' });
        const availableQueue = allAvailable.filter(p => p._id.toString() !== playerId).map(p => p._id);
        const auction = await Auction.create({ currentPlayer: playerId, currentBid: player.basePrice, status: 'running', timer: 30, availableQueue, unsoldQueue: [], phase: 'available', maxPlayersPerTeam: maxPlayers || 5 });
        io.emit('auctionStarted', { player, currentBid: player.basePrice, timer: 30, currentLeader: '', bidHistory: [] });
        startTimer(io, auction._id);
      } catch (err) { console.log('Start error:', err.message); }
    });

    socket.on('pauseAuction', async () => {
      try {
        const auction = await Auction.findOneAndUpdate({ status: 'running' }, { status: 'paused' }, { new: true });
        if (auction) io.emit('auctionPaused', {});
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
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        const auction = await Auction.findOne({ status: { $in: ['running', 'paused'] } });
        if (!auction) return;
        const player = await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' }, { new: true });
        if (!auction.unsoldQueue.map(id => id.toString()).includes(auction.currentPlayer.toString())) {
          auction.unsoldQueue.push(auction.currentPlayer);
        }
        auction.status = 'transitioning';
        await auction.save();
        io.emit('playerUnsold', { player });
        setTimeout(async () => { await loadNextPlayer(io, auction._id); }, 3500);
      } catch (err) {}
    });

    socket.on('placeBid', async ({ ownerId, amount }) => {
      try {
        const auction = await Auction.findOne({ status: 'running' });
        if (!auction) { socket.emit('bidError', { message: 'No active auction!' }); return; }
        if (amount <= auction.currentBid) { socket.emit('bidError', { message: 'Bid must be higher!' }); return; }
        const owner = await Owner.findById(ownerId).populate('team');
        if (!owner) return;
        const maxPlayers = auction.maxPlayersPerTeam || 5;
        if (owner.team.length >= maxPlayers) { socket.emit('bidError', { message: 'Team is full! Max ' + maxPlayers + ' players.' }); return; }
        if (owner.availableCoins < amount) { socket.emit('bidError', { message: 'Insufficient coins!' }); return; }
        if (auction.currentLeader && auction.currentLeader.toString() !== ownerId) {
          const prev = await Owner.findById(auction.currentLeader);
          if (prev) { prev.reservedCoins = Math.max(0, prev.reservedCoins - auction.currentBid); prev.availableCoins += auction.currentBid; await prev.save(); }
        }
        if (!auction.currentLeader || auction.currentLeader.toString() !== ownerId) {
          owner.reservedCoins += amount; owner.availableCoins -= amount;
        } else {
          const diff = amount - auction.currentBid; owner.reservedCoins += diff; owner.availableCoins -= diff;
        }
        await owner.save();
        auction.currentBid = amount; auction.currentLeader = ownerId; auction.currentLeaderName = owner.name;
        if (auction.timer < 8) auction.timer = 8;
        auction.bidHistory.push({ owner: ownerId, ownerName: owner.name, amount });
        await auction.save();
        io.emit('bidUpdated', { currentBid: amount, currentLeader: owner.name, timer: auction.timer });
      } catch (err) { console.log('Bid error:', err.message); }
    });
  });

  setTimeout(async () => {
    try {
      const auction = await Auction.findOne({ status: 'running' });
      if (auction) { console.log('Recovering auction...'); startTimer(io, auction._id); }
    } catch (err) {}
  }, 2000);
};
