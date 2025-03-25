import { Document, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  CHEF = 'chef',
  CUSTOMER = 'customer',
}

export interface User extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}
