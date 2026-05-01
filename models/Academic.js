const mongoose = require('mongoose');

const AcademicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  icon: { type: String, default: '🎓' },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

AcademicSchema.index({ userId: 1 });

module.exports = mongoose.model('Academic', AcademicSchema);
