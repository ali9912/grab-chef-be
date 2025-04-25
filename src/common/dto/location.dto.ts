import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LocationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  locationId: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  key: string;

  @IsOptional()
  location: { coordinates: [number] };
}
