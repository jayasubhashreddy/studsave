const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

/**
 * GET /api/admin/locks
 * Returns all subjects with locks (isLocked: true) and their folder/password info
 * FORMAT: Admin can see folder names and hashed passwords (for reference)
 */
router.get('/locks', async (req, res) => {
  try {
    // Get all subjects that are locked
    const lockedSubjects = await Subject.find({ isLocked: true })
      .select('name semesterId academicId isLocked pinHash createdAt')
      .populate('semesterId', 'name')
      .populate('academicId', 'name')
      .sort({ createdAt: -1 });

    const result = lockedSubjects.map(subject => ({
      _id: subject._id,
      folderName: subject.name,
      academicYear: subject.academicId?.name || 'Unknown',
      semester: subject.semesterId?.name || 'Unknown',
      isLocked: subject.isLocked,
      passwordHash: subject.pinHash, // Hash shown for admin reference
      lockedSince: subject.createdAt
    }));

    res.json({ 
      total: result.length,
      locks: result
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/all-subjects
 * Returns all subjects with lock status in a clean admin format
 */
router.get('/all-subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({})
      .select('name semesterId academicId isLocked pinHash')
      .populate('semesterId', 'name')
      .populate('academicId', 'name')
      .sort({ academicId: 1, semesterId: 1, name: 1 });

    const result = subjects.map(s => ({
      _id: s._id,
      folder: s.name,
      academic: s.academicId?.name || '-',
      semester: s.semesterId?.name || '-',
      locked: s.isLocked,
      passwordHash: s.isLocked ? s.pinHash : null
    }));

    // Group by academic year for cleaner view
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
