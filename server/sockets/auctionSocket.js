const Auction = require('../models/Auction');
const Owner = require('../models/Owner');
const Player = require('../models/Player');

let timerInterval = null;

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinAuction', () => {
      socket.join('auction');
      console.log('User joined auction room');
    });

    socket.on('placeBid', async ({ ownerId, amount }) => {
      try {
        const auction = await Auction.findOne({ status: 'running' });
        if (!auction) return;
        if (amount <= auction.currentBid) return;

        const owner = await Owner.findById(ownerId);
        if (!owner || owner.availableCoins < amount) return;

        if (auction.currentLeader) {
          const prevLeader = await Owner.findById(auction.currentLeader);
          if (prevLeader) {
            prevLeader.reservedCoins -= auction.currentBid;
            prevLeader.availableCoins += auction.currentBid;
            await prevLeader.save();
          }
        }

        owner.reservedCoins += amount;
        owner.availableCoins -= amount;
        await owner.save();

        auction.currentBid = amount;
        auction.currentLeader = ownerId;
        auction.bidHistory.push({ owner: ownerId, amount });

        if (auction.timer < 5) auction.timer = 5;
        await auction.save();

        io.to('auction').emit('bidUpdated', {
          currentBid: amount,
          currentLeader: owner.name,
          timer: auction.timer
        });
      } catch (err) {
        console.log('Bid error:', err);
      }
    });

    socket.on('startAuction', async ({ playerId }) => {
      try {
        await Auction.deleteMany({});
        const auction = await Auction.create({
          currentPlayer: playerId,
          status: 'running',
          timer: 30
        });

        const player = await Player.findById(playerId);
        auction.currentBid = player.basePrice;
        await auction.save();

        io.to('auction').emit('auctionStarted', {
          player,
          currentBid: player.basePrice,
          timer: 30
        });

        startTimer(io, auction._id);
      } catch (err) {
        console.log('Start error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

function startTimer(io, auctionId) {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    try {
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== 'running') {
        clearInterval(timerInterval);
        return;
      }
      auction.timer -= 1;
      await auction.save();
      io.to('auction').emit('timerUpdate', { timer: auction.timer });

      if (auction.timer <= 0) {
        clearInterval(timerInterval);
        if (auction.currentLeader) {
          const winner = await Owner.findById(auction.currentLeader);
          winner.reservedCoins -= auction.currentBid;
          winner.team.push(auction.currentPlayer);
          await winner.save();
          await Player.findByIdAndUpdate(auction.currentPlayer, {
            status: 'sold', soldTo: auction.currentLeader, soldPrice: auction.currentBid
          });
          auction.status = 'ended';
          await auction.save();
          io.to('auction').emit('playerSold', { winner: winner.name, amount: auction.currentBid });
        } else {
          await Player.findByIdAndUpdate(auction.currentPlayer, { status: 'unsold' });
          auction.status = 'ended';
          await auction.save();
          io.to('auction').emit('playerUnsold', {});
        }
      }
    } catch (err) {
      console.log('Timer error:', err);
    }
  }, 1000);
}
