const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Unit    = require('../models/Unit');

// Get units by subject
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const units = await Unit.find({ subjectId: req.params.subjectId, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(units);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get units by semester (no subject)
router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const units = await Unit.find({ semesterId: req.params.semesterId, subjectId: null, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(units);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get units by academic (no semester, no subject)
router.get('/academic/:academicId', auth, async (req, res) => {
  try {
    const units = await Unit.find({ academicId: req.params.academicId, semesterId: null, subjectId: null, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(units);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const unit = await Unit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json(unit);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, subjectId, semesterId, academicId } = req.body;
    if (!name || !academicId) return res.status(400).json({ message: 'name and academicId are required' });
    const unit = await Unit.create({
      userId: req.user._id,
      subjectId:  subjectId  || null,
      semesterId: semesterId || null,
      academicId,
      name,
      description,
      content: []
    });
    res.status(201).json(unit);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description, updatedAt: new Date() },
      { new: true }
    );
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json(unit);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Auto-save content blocks
router.patch('/:id/content', auth, async (req, res) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { content: req.body.content, updatedAt: new Date() },
      { new: true }
    );
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json({ saved: true, updatedAt: unit.updatedAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const unit = await Unit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { progress: req.body.progress },
      { new: true }
    );
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json({ progress: unit.progress });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const unit = await Unit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!unit) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
