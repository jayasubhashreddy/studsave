const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ semesterId: req.params.semesterId, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, semesterId, academicId, color, icon } = req.body;
    if (!name || !semesterId || !academicId) return res.status(400).json({ message: 'Required fields missing' });
    const subject = await Subject.create({ userId: req.user._id, semesterId, academicId, name, description, color, icon });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description, color, icon },
      { new: true }
    );
    if (!subject) return res.status(404).json({ message: 'Not found' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Not found' });
    await Unit.deleteMany({ subjectId: req.params.id });
    await Subject.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
