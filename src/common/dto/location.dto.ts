import { IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsNumber()
  @IsOptional()
  latitude: number;

  @IsNumber()
  @IsOptional()
  longitude: number;
}
