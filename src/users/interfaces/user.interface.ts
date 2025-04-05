import { Customer } from 'aws-sdk/clients/connect';
import { Document, Types } from 'mongoose';
import { Chef } from 'src/chef/interfaces/chef.interface';

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
  password: string;
  chef?: Chef;
  customer?: Customer;
  experience?: number;
}
