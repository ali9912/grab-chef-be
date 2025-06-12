import * as mongoose from 'mongoose';

export const DataSchema = new mongoose.Schema({
  type: {
    type: String,
    required: false,
  },
  data: {
    type: String,
    required: false,
  },
});
export const NotificationsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  data: DataSchema,
});
