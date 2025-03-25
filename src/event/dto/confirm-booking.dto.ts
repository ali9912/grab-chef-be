import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

enum BookingStatus {
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export class ConfirmBookingDto {
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
