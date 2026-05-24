const express = require('express');
const router = express.Router();
const Owner = require('../models/Owner');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const owner = await Owner.create({ name, email, password: hashed });
    res.json({ success: true, owner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const owner = await Owner.findOne({ email });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    const match = await bcrypt.compare(password, owner.password);
    if (!match) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, owner });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const owners = await Owner.find().select('-password');
  res.json(owners);
});

module.exports = router;
