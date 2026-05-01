const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentFolderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#6366f1' },
  // Lock: plain text password stored directly (no hashing as requested)
  lockPassword: { type: String, default: null },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

FolderSchema.index({ userId: 1 });
FolderSchema.index({ parentFolderId: 1 });
module.exports = mongoose.model('Folder', FolderSchema);
