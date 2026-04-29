const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema({
  academicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Academic', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true }
}, { timestamps: true });

SemesterSchema.index({ academicId: 1 });

module.exports = mongoose.model('Semester', SemesterSchema);
