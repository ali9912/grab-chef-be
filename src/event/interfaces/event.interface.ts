import { Document, Types } from 'mongoose';
import { LocationType } from 'src/common/interfaces/location.interface';

export enum EventStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AttendanceStatus {
  ATTENDED = 'attended',
  NO_SHOW = 'no-show',
}

export interface MenuItem {
  menuItemId: Types.ObjectId;
  quantity: number;
}

export interface Attendance {
  status: AttendanceStatus;
  markedAt: string;
  location?: LocationType;
}

export interface Event extends Document {
  customer: Types.ObjectId;
  chef: Types.ObjectId;
  area: string;
  fullAddress: LocationType;
  menuItems: MenuItem[];
  date: Date;
  time: string;
  status: EventStatus;
  rejectionReason?: string;
  attendance?: Attendance;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  orderId: number;
}

export interface Counter extends Document {
  name: string;
  value: number;
}
