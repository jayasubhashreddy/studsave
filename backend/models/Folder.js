const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#6366f1' },
}, { timestamps: true });

FolderSchema.index({ userId: 1 });
module.exports = mongoose.model('Folder', FolderSchema);
