import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

enum BookingStatus {
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export class ConfirmBookingDto {
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: string;

  @ValidateIf((o) => o.status === BookingStatus.REJECTED) // Only validate if status is REJECTED
  @IsString()
  @IsNotEmpty({ message: 'Reason is required when status is REJECTED' })
  reason?: string;
}

export class CancelBookingDto {
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty({ message: 'Reason is required when status is REJECTED' })
  reason?: string;
}
