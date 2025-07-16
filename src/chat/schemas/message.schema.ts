import * as mongoose from 'mongoose';

export const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  // File attachment fields
  fileUrl: { type: String, required: false },
  fileName: { type: String, required: false },
  fileType: { type: String, required: false }, // 'image', 'document', etc.
}); 