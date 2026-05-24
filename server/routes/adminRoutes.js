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
    const player = await Player.create(req.body);
    res.json({ success: true, player });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/owners', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const owner = await Owner.create({ name, email, password: hashed });
    res.json({ success: true, owner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/players', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

router.get('/owners', async (req, res) => {
  const owners = await Owner.find().select('-password');
  res.json(owners);
});

router.delete('/players/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
