const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

router.post('/players', async (req, res) => {
  try {
    const { name, role, group, basePrice } = req.body;
    if (!name || !group) return res.status(400).json({ error: 'Name and group required' });
    const player = await Player.create({ name, role, group, basePrice: parseInt(basePrice) });
    res.json({ success: true, player });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/owners', async (req, res) => {
  try {
    const { name, email, password, totalCoins } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const hashed = await bcrypt.hash(password, 10);
    const coins = parseInt(totalCoins) || 15000;
    const owner = await Owner.create({ name, email, password: hashed, totalCoins: coins, availableCoins: coins });
    res.json({ success: true, owner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/players', async (req, res) => {
  const players = await Player.find().sort({ group: 1 });
  res.json(players);
});

router.get('/owners', async (req, res) => {
  const owners = await Owner.find().select('-password');
  res.json(owners);
});

router.put('/owners/:id/coins', async (req, res) => {
  try {
    const { coins } = req.body;
    const owner = await Owner.findByIdAndUpdate(req.params.id, { totalCoins: coins, availableCoins: coins, reservedCoins: 0 }, { new: true });
    res.json({ success: true, owner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/players/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.delete('/owners/:id', async (req, res) => {
  await Owner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
