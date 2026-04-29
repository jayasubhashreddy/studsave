const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Folder = require('../models/Folder');
const File = require('../models/File');

// Get all folders
router.get('/', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json(folders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const folder = await Folder.create({ userId: req.user._id, name, icon, color });
    res.status(201).json(folder);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update folder
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, icon, color }, { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Not found' });
    res.json(folder);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete folder + all files inside
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Not found' });
    await File.deleteMany({ folderId: req.params.id });
    await Folder.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
