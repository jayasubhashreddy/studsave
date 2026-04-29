const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  academicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Academic', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  color: { type: String, default: '#8b5cf6' },
  icon: { type: String, default: '📚' }
}, { timestamps: true });

SubjectSchema.index({ semesterId: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
