const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

router.get('/academic/:academicId', auth, async (req, res) => {
  try {
    const semesters = await Semester.find({ academicId: req.params.academicId, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, academicId } = req.body;
    if (!name || !academicId) return res.status(400).json({ message: 'Name and academicId required' });
    const semester = await Semester.create({ userId: req.user._id, academicId, name, description });
    res.status(201).json(semester);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description },
      { new: true }
    );
    if (!semester) return res.status(404).json({ message: 'Not found' });
    res.json(semester);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.id, userId: req.user._id });
    if (!semester) return res.status(404).json({ message: 'Not found' });
    await Unit.deleteMany({ semesterId: req.params.id });
    await Subject.deleteMany({ semesterId: req.params.id });
    await Semester.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
