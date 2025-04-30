import mongoose from 'mongoose';

export const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  key: { type: String },
  location: {
    // Store GeoJSON data
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] }, // [longitude, latitude]
  },
});

LocationSchema.index({ location: '2dsphere' });
