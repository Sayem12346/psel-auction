const Auction = require('../models/Auction');
const Owner = require('../models/Owner');
const Player = require('../models/Player');

let timerInterval = null;
let isPaused = false;
let playerQueue = [];

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinAuction', () => socket.join('auction'));

    socket.on('setQueue', ({ queue }) => {
      playerQueue = queue;
      console.log('Queue set:', playerQueue.length, 'players');
    });

    socket.on('startAuction', async ({ playerId }) => {
      try {
        if (timerInterval) clearInterval(timerInterval);
        isPaused = false;
        await Auction.deleteMany({});
        const player = await Player.findById(playerId);
        if (!player) return;
        const auction = await Auction.create({
          currentPlayer: playerId,
          status: 'running',
          timer: 30,
          currentBid: player.basePrice
        });
        io.emit('auctionStarted', { player, currentBid: player.basePrice, timer: 30 });
        startTimer(io, auction._id);
      } catch (err) { console.log('Start error:', err); }
    });

    socket.on('pauseAuction', async () => {
      isPaused = true;
      await Auction.findOneAndUpdate({ status: 'running' }, { status: 'paused' });
      io.emit('auctionPaused', {});
    });

    socket.on('resumeAuction', async () => {
      isPaused = false;
      const auction = await Auction.findOneAndUpdate({ status: 'paused' }, { status: 'running' }, { new: true });
      if (auction) {
        io.emit('auctionResumed', {});
        startTimer(io, auction._id);
      }
    });

    socket.on('placeBid', async ({ ownerId, amount }) => {
      try {
        const auction = await Auction.findOne({ status: 'running' });
        if (!auction) return;
        if (amount <= auction.currentBid) return;
        const owner = await Owner.findById(ownerId);
        if (!owner || owner.availableCoins < amount) return;
        if (auction.currentLeader) {
          const prev = await Owner.findById(auction.currentLeader);
          if (prev) { prev.reservedCoins -= auction.currentBid; prev.availableCoins += auction.currentBid; await prev.save(); }
        }
        owner.reservedCoins += amount;
        owner.availableCoins -= amount;
        await owner.save();
        auction.currentBid = amount;
        auction.currentLeader = ownerId;
        auction.bidHistory.push({ owner: ownerId, amount });
        if (auction.timer < 5) auction.timer = 5;
        await auction.save();
        io.emit('bidUpdated', { currentBid: amount, currentLeader: owner.name, timer: auction.timer });
      } catch (err) { console.log('Bid error:', err); }
    });
  });
};

function startTimer(io, auctionId) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    if (isPaused) return;
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== 'running') { clearInterval(timerInterval); return; }
      auction.timer -= 1;
      await auction.save();
      io.emit('timerUpdate', { timer: auction.timer });
      if (auction.timer <= 0) {
        clearInterval(timerInterval);
        if (auction.currentLeader) {
          const winner = await Owner.findById(auction.currentLeader);
          if (winner) { winner.reservedCoins -= auction.currentBid; winner.team.push(auction.currentPlayer); await winner.save(); }
          await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'sold', soldTo: auction.currentLeader, soldPrice: auction.currentBid });
          auction.status = 'ended';
          await auction.save();
          io.emit('playerSold', { winner: winner?.name, amount: auction.currentBid });
        } else {
          await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' });
          auction.status = 'ended';
          await auction.save();
          io.emit('playerUnsold', {});
        }
        if (playerQueue.length > 0) {
          const nextId = playerQueue.shift();
          setTimeout(async () => {
            const nextPlayer = await Player.findById(nextId);
            if (nextPlayer) {
              const newAuction = await Auction.create({ currentPlayer: nextId, status: 'running', timer: 30, currentBid: nextPlayer.basePrice });
              io.emit('auctionStarted', { player: nextPlayer, currentBid: nextPlayer.basePrice, timer: 30 });
              startTimer(io, newAuction._id);
            }
          }, 3000);
        } else {
          setTimeout(() => { io.emit('auctionEnded', {}); }, 3000);
        }
      }
    } catch (err) { console.log('Timer error:', err); }
  }, 1000);
}
