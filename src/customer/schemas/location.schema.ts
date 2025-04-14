import * as mongoose from 'mongoose';

export const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // `name` is required
  latitude: { type: Number, required: false, default: 0 }, // Default value is 0
  longitude: { type: Number, required: false, default: 0 }, // Default value is 0
});
