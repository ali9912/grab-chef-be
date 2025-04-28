import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';


export class CoordinatesDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[];
}


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
  @ValidateNested()
  @Type(() => CoordinatesDto)
  location?: CoordinatesDto;
}
