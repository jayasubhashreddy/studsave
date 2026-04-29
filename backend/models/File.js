const mongoose = require('mongoose');

const ContentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'code', 'image'], required: true },
  title: { type: String, default: '' },
  value: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const FileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  name: { type: String, required: true, trim: true },
  content: [ContentBlockSchema],
}, { timestamps: true });

FileSchema.index({ folderId: 1 });
module.exports = mongoose.model('File', FileSchema);
