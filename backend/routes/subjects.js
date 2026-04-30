const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const auth    = require('../middleware/auth');
const Subject = require('../models/Subject');
const Unit    = require('../models/Unit');

// Simple PIN hashing (no bcrypt needed — keep deps minimal)
const hashPin = (pin) => crypto.createHash('sha256').update(pin + 'studsave_salt').digest('hex');

router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ semesterId: req.params.semesterId, userId: req.user._id })
      .select('-pinHash')  // never send hash to client
      .sort({ createdAt: 1 });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, semesterId, academicId, color, icon } = req.body;
    if (!name || !semesterId || !academicId) return res.status(400).json({ message: 'Required fields missing' });
    const subject = await Subject.create({ userId: req.user._id, semesterId, academicId, name, description, color, icon });
    res.status(201).json({ ...subject.toObject(), pinHash: undefined });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description, color, icon },
      { new: true }
    ).select('-pinHash');
    if (!subject) return res.status(404).json({ message: 'Not found' });
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Not found' });
    await Unit.deleteMany({ subjectId: req.params.id });
    await Subject.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Lock: set PIN on a folder ──────────────────────────────────
router.post('/:id/lock', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) return res.status(400).json({ message: 'PIN must be at least 4 digits' });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isLocked: true, pinHash: hashPin(String(pin)) },
      { new: true }
    ).select('-pinHash');
    if (!subject) return res.status(404).json({ message: 'Not found' });
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Unlock: verify PIN ─────────────────────────────────────────
router.post('/:id/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Not found' });
    if (!subject.isLocked) return res.json({ success: true });
    const match = subject.pinHash === hashPin(String(pin));
    if (!match) return res.status(401).json({ message: 'Wrong PIN' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Remove lock ────────────────────────────────────────────────
router.post('/:id/remove-lock', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ message: 'Not found' });
    if (subject.pinHash && subject.pinHash !== hashPin(String(pin))) {
      return res.status(401).json({ message: 'Wrong PIN' });
    }
    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      { isLocked: false, pinHash: null },
      { new: true }
    ).select('-pinHash');
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
