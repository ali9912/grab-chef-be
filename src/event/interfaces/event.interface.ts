import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Document, Types } from 'mongoose';
import { LocationType } from 'src/common/interfaces/location.interface';

export enum EventStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AttendanceStatus {
  ATTENDED = 'attended',
  NO_SHOW = 'no-show',
  CHECK_OUT = 'checkout',
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

export type Ingredients = {
  name: string;
  quantity?: number;
};

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
  attendance?: Attendance[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  orderId: number;
  cancelReason?: string;
  ingredients: Ingredients[];
}

export interface Counter extends Document {
  name: string;
  value: number;
}

export class GetEventQueryType {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  @IsEnum(EventStatus)
  status?: string;
}
