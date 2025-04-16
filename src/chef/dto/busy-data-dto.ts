import { IsArray, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class BusyDataDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsArray()
  timeSlots: string[];
}
