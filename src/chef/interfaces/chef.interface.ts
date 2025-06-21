import { Document } from 'mongoose';
import { Types } from 'mongoose';
import { Achievements } from 'src/achievements/interfaces/achievement.interface';
import { LocationType } from 'src/common/interfaces/location.interface';

export enum ChefVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type TimeSlotType = {
  time: string;
  isEvent: boolean;
};

export type BusyDaysType = {
  _id?: Types.ObjectId;
  date: Date;
  timeSlots: TimeSlotType[];
};

export type EmergencyType = {
  description: string;
  phoneNumber: string;
};

export interface Chef extends Document {
  _id: string;
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

  noOfReviews: number;
  avgRating: number;
  completedOrders: number;

  noOfFiveStars?: number;
  noOfFourStars?: number;

  achievements?: Achievements[];

  hasAddeddEmergencyContact?: boolean;
  emergencyContact: EmergencyType[];
}

export interface FavouriteChef extends Document {
  customer: Types.ObjectId;
  chef: Types.ObjectId;
}
