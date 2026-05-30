const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  currentBid: { type: Number, default: 0 },
  currentLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', default: null },
  currentLeaderName: { type: String, default: '' },
  timer: { type: Number, default: 30 },
  status: { type: String, enum: ['waiting', 'running', 'paused', 'ended', 'processing', 'transitioning'], default: 'waiting' },
  availableQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  unsoldQueue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  phase: { type: String, enum: ['available', 'unsold'], default: 'available' },
  maxPlayersPerTeam: { type: Number, default: 5 },
  bidHistory: [{ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }, ownerName: { type: String }, amount: { type: Number }, time: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);
