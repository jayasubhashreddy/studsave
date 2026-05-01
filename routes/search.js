const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Academic = require('../models/Academic');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });

    const regex = new RegExp(q.trim(), 'i');
    const userId = req.user._id;

    const [academics, semesters, subjects, units] = await Promise.all([
      Academic.find({ userId, name: regex }).limit(5),
      Semester.find({ userId, name: regex }).limit(5),
      Subject.find({ userId, name: regex }).limit(5),
      Unit.find({ userId, $or: [{ name: regex }, { description: regex }] }).limit(10)
    ]);

    res.json({
      results: [
        ...academics.map(a => ({ type: 'academic', id: a._id, name: a.name, icon: a.icon || '🎓' })),
        ...semesters.map(s => ({ type: 'semester', id: s._id, name: s.name, academicId: s.academicId })),
        ...subjects.map(s => ({ type: 'subject', id: s._id, name: s.name, semesterId: s.semesterId, academicId: s.academicId })),
        ...units.map(u => ({ type: 'unit', id: u._id, name: u.name, subjectId: u.subjectId, progress: u.progress }))
      ]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
