import { IsNumber, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';

export type LocationType = {
  name: string;
  latitude?: number;
  longitude?: number;
};

export class LocationDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  latitude: number;

  @IsNumber()
  @IsOptional()
  longitude: number;
}

export const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // `name` is required
  latitude: { type: Number, required: false, default: 0 }, // Default value is 0
  longitude: { type: Number, required: false, default: 0 }, // Default value is 0
});
