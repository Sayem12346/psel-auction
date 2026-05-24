const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

router.post('/', async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.json({ success: true, player });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, player });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
