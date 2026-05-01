const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const Folder = require('../models/Folder');

/**
 * GET /api/admin/locks
 * Returns all subjects AND folders with locks
 */
router.get('/locks', auth, async (req, res) => {
  try {
    // Locked subjects
    const lockedSubjects = await Subject.find({ isLocked: true })
      .select('name semesterId academicId isLocked pin createdAt')
      .populate('semesterId', 'name')
      .populate('academicId', 'name')
      .sort({ createdAt: -1 });

    const subjectLocks = lockedSubjects.map(subject => ({
      _id: subject._id,
      type: 'subject',
      folderName: subject.name,
      academicYear: subject.academicId?.name || 'Unknown',
      semester: subject.semesterId?.name || 'Unknown',
      isLocked: subject.isLocked,
      password: subject.pin,       // plain text as stored
      lockedSince: subject.createdAt
    }));

    // Locked folders
    const lockedFolders = await Folder.find({ userId: req.user._id, isLocked: true })
      .select('name isLocked lockPassword createdAt')
      .sort({ createdAt: -1 });

    const folderLocks = lockedFolders.map(folder => ({
      _id: folder._id,
      type: 'folder',
      folderName: folder.name,
      isLocked: folder.isLocked,
      password: folder.lockPassword, // plain text as stored
      lockedSince: folder.createdAt
    }));

    res.json({
      total: subjectLocks.length + folderLocks.length,
      locks: [...subjectLocks, ...folderLocks]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/all-subjects
 * Returns all subjects with lock status
 */
router.get('/all-subjects', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({})
      .select('name semesterId academicId isLocked pin')
      .populate('semesterId', 'name')
      .populate('academicId', 'name')
      .sort({ academicId: 1, semesterId: 1, name: 1 });

    const result = subjects.map(s => ({
      _id: s._id,
      folder: s.name,
      academic: s.academicId?.name || '-',
      semester: s.semesterId?.name || '-',
      locked: s.isLocked,
      password: s.isLocked ? s.pin : null  // plain text
    }));

    const grouped = {};
    result.forEach(item => {
      if (!grouped[item.academic]) grouped[item.academic] = {};
      if (!grouped[item.academic][item.semester]) grouped[item.academic][item.semester] = [];
      grouped[item.academic][item.semester].push(item);
    });

    res.json({
      totalSubjects: subjects.length,
      lockedCount: subjects.filter(s => s.isLocked).length,
      byAcademic: grouped
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
