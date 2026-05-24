const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: '' },
  group: { type: String, required: true },
  basePrice: { type: Number, required: true },
  playerImage: { type: String, default: '' },
  status: { type: String, enum: ['available', 'sold', 'unsold'], default: 'available' },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', default: null },
  soldPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
