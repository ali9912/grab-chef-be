import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BusyDataDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  timeSlots: string[];
}

export class RemoveDateDto {
  @ValidateNested()
  @Type(() => BusyDataDto)
  slots: BusyDataDto;
}
