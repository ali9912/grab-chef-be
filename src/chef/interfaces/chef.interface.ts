import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { LocationType } from 'src/common/interfaces/location.interface';

export enum ChefVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type BusyDaysType = {
  date: Date;
  timeSlots: string[];
};

export interface Chef extends Document {
  userId: Types.ObjectId;
  idCard?: string;
  certificates?: string;
  bio?: string;
  status?: ChefVerificationStatus;
  rating?: number;
  createdAt?: Date;
  experience?: number;
  locations?: LocationType[];
  busyDays?: BusyDaysType[];
}
