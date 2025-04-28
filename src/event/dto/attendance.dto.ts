import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '../interfaces/event.interface';
import { LocationDto } from 'src/common/dto/location.dto';
import { Type } from 'class-transformer';

export class AttendanceDto {
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsDateString()
  markedAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
