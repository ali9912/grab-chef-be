import { Document } from 'mongoose';

export interface Otp extends Document {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}
