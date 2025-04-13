import { IsNumber, IsOptional, IsString } from 'class-validator';

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
