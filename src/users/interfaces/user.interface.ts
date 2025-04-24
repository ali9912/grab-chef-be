
import { Document, Types } from 'mongoose';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { Customer } from 'src/customer/interface/customer.interface';

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
  phoneNumber?: string;
  profilePicture?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  password: string;
  chef?: Chef;
  customer?: Customer;
}
