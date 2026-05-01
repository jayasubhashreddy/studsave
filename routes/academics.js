const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Academic = require('../models/Academic');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

// Get all academics for user
router.get('/', auth, async (req, res) => {
  try {
    const academics = await Academic.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(academics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create academic
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const academic = await Academic.create({ userId: req.user._id, name, description, icon, color });
    res.status(201).json(academic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update academic
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    const academic = await Academic.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description, icon, color },
      { new: true }
    );
    if (!academic) return res.status(404).json({ message: 'Not found' });
    res.json(academic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete academic (cascade)
router.delete('/:id', auth, async (req, res) => {
  try {
    const academic = await Academic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!academic) return res.status(404).json({ message: 'Not found' });

    await Unit.deleteMany({ academicId: req.params.id });
    await Subject.deleteMany({ academicId: req.params.id });
    await Semester.deleteMany({ academicId: req.params.id });
    await Academic.deleteOne({ _id: req.params.id });

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
