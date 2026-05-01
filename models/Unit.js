const mongoose = require('mongoose');

const ContentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'code', 'image'], required: true },
  title: { type: String, default: '' },
  value: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const UnitSchema = new mongoose.Schema({
  subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject',  default: null },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', default: null },
  academicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Academic', required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  progress:    { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  content:     [ContentBlockSchema]
}, { timestamps: true });

UnitSchema.index({ subjectId: 1 });
UnitSchema.index({ semesterId: 1 });
UnitSchema.index({ academicId: 1 });

module.exports = mongoose.model('Unit', UnitSchema);
