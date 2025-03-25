import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '../interfaces/event.interface';

export class AttendanceDto {
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
