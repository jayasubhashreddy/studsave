const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Folder = require('../models/Folder');
const File = require('../models/File');

// Get all top-level folders (no parent)
router.get('/', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id, parentFolderId: null }).sort({ createdAt: 1 });
    res.json(folders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get subfolders of a given folder
router.get('/:id/subfolders', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id, parentFolderId: req.params.id }).sort({ createdAt: 1 });
    res.json(folders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create folder (top-level or subfolder)
router.post('/', auth, async (req, res) => {
  try {
    const { name, icon, color, parentFolderId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const folder = await Folder.create({
      userId: req.user._id,
      name, icon, color,
      parentFolderId: parentFolderId || null
    });
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

// Set lock on a folder (stores plain text password directly as requested)
router.post('/:id/lock', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.trim() === '') return res.status(400).json({ message: 'Password required' });
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isLocked: true, lockPassword: password.trim() },
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Folder locked', isLocked: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove lock from a folder (must provide password to confirm)
router.post('/:id/unlock', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Not found' });
    if (folder.isLocked && folder.lockPassword !== password) {
      return res.status(403).json({ message: 'Wrong password' });
    }
    folder.isLocked = false;
    folder.lockPassword = null;
    await folder.save();
    res.json({ message: 'Folder unlocked', isLocked: false });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Verify password to access a locked folder (returns success/fail)
router.post('/:id/verify', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Not found' });
    if (!folder.isLocked) return res.json({ success: true });
    if (folder.lockPassword === password) return res.json({ success: true });
    return res.status(403).json({ success: false, message: 'Wrong password' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete folder + all subfolders + all files inside recursively
async function deleteFolderRecursive(folderId, userId) {
  const subfolders = await Folder.find({ parentFolderId: folderId, userId });
  for (const sub of subfolders) {
    await deleteFolderRecursive(sub._id, userId);
  }
  await File.deleteMany({ folderId });
  await Folder.deleteOne({ _id: folderId });
}

router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Not found' });
    await deleteFolderRecursive(req.params.id, req.user._id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
