import { Document } from 'mongoose';

export interface Location extends Document {
  userId: string;
  name: string;
  longitude: string;
  latitude: string;
  street: string;
  houseNumber: string;
  city: string;
  country: string;
  createdAt: Date;
}
