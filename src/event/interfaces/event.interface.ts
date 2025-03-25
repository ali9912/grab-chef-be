import { Document, Types } from 'mongoose';

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
  remarks?: string;
  markedAt: Date;
}

export interface Event extends Document {
  customer: Types.ObjectId;
  chef: Types.ObjectId;
  location: Types.ObjectId;
  menuItems: MenuItem[];
  dateTime: Date;
  specialRequests?: string;
  status: EventStatus;
  rejectionReason?: string;
  attendance?: Attendance;
  totalAmount: number;
  tax: number;
  createdAt: Date;
  updatedAt: Date;
}
