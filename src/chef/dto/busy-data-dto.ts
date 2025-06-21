import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BusyDataDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  timeSlots: TimeSlotDto[];
}
export class TimeSlotDto {
  @IsString()
  @IsNotEmpty()
  time: string;

  @IsOptional()
  isEvent: boolean;
}

export class RemoveDateDto {
  @ValidateNested()
  @Type(() => BusyDataDto)
  slots: BusyDataDto;
}
