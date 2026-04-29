const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');

// Get files in a folder
router.get('/folder/:folderId', auth, async (req, res) => {
  try {
    const files = await File.find({ folderId: req.params.folderId, userId: req.user._id }).sort({ createdAt: 1 });
    res.json(files);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create file
router.post('/', auth, async (req, res) => {
  try {
    const { name, folderId } = req.body;
    if (!name || !folderId) return res.status(400).json({ message: 'Name and folderId required' });
    const file = await File.create({ userId: req.user._id, folderId, name, content: [] });
    res.status(201).json(file);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Rename file
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name }, { new: true }
    );
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json(file);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Save content blocks
router.patch('/:id/content', auth, async (req, res) => {
  try {
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { content: req.body.content }, { new: true }
    );
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json({ saved: true, updatedAt: file.updatedAt });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!file) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
