const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  totalCoins: { type: Number, default: 15000 },
  reservedCoins: { type: Number, default: 0 },
  availableCoins: { type: Number, default: 15000 },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }]
}, { timestamps: true });

module.exports = mongoose.model('Owner', ownerSchema);
