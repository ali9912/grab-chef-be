import * as mongoose from 'mongoose';
import { UserRole } from '../interfaces/user.interface';

export const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  phoneNumber: {
    type: String,
    unique: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    unique: true,
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    unique: true,
  },
});
