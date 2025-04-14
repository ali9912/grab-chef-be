import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '../interfaces/event.interface';
import { LocationDto } from 'src/common/interfaces/location.interface';

export class AttendanceDto {
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsDateString()
  markedAt?: string;

  @IsOptional()
  location: LocationDto;
}
