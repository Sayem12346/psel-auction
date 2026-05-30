const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

const ADMIN_EMAIL = 'admin@psel.com';
const ADMIN_PASSWORD = 'admin123';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
    return res.json({ success: true, token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/stats', async (req, res) => {
  const totalPlayers = await Player.countDocuments();
  const soldPlayers = await Player.countDocuments({ status: 'sold' });
  const totalOwners = await Owner.countDocuments();
  res.json({ totalPlayers, soldPlayers, totalOwners });
});

router.post('/players', upload.single('image'), async (req, res) => {
  try {
    const { name, role, group, basePrice } = req.body;
    if (!name || !group) return res.status(400).json({ error: 'Name and group required' });
    let playerImage = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'psel-auction/players');
      playerImage = result.secure_url;
    }
    const player = await Player.create({ name, role: role||'', group, basePrice: parseInt(basePrice)||500, playerImage });
    res.json({ success: true, player });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/owners', upload.single('image'), async (req, res) => {
  try {
    const { name, email, password, totalCoins } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const hashed = await bcrypt.hash(password, 10);
    const coins = parseInt(totalCoins) || 15000;
    let profileImage = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'psel-auction/owners');
      profileImage = result.secure_url;
    }
    const owner = await Owner.create({ name, email, password: hashed, totalCoins: coins, availableCoins: coins, profileImage });
    res.json({ success: true, owner });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/players', async (req, res) => {
  const players = await Player.find().sort({ group: 1 });
  res.json(players);
});

router.get('/owners', async (req, res) => {
  const owners = await Owner.find().select('-password').populate('team');
  res.json(owners);
});

router.put('/owners/:id/coins', async (req, res) => {
  try {
    const coins = parseInt(req.body.coins);
    const owner = await Owner.findByIdAndUpdate(req.params.id, { totalCoins: coins, availableCoins: coins, reservedCoins: 0 }, { new: true });
    res.json({ success: true, owner });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/owners/:id/remove-player', async (req, res) => {
  try {
    const { playerId } = req.body;
    await Owner.findByIdAndUpdate(req.params.id, { $pull: { team: playerId } });
    await Player.findByIdAndUpdate(playerId, { status: 'available', soldTo: null, soldPrice: 0 });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/players/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.delete('/owners/:id', async (req, res) => {
  await Owner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.get('/auction/status', async (req, res) => {
  try {
    const auction = await Auction.findOne({ status: { $in: ['running', 'paused'] } }).populate('currentPlayer');
    res.json(auction || null);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/auction/close', async (req, res) => {
  try {
    await Auction.updateMany({}, { status: 'ended' });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
