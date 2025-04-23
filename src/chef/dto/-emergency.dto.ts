import { IsString } from 'class-validator';

export class CreateEmergencyDto {
  @IsString()
  description: string;

  @IsString()
  phoneNumber: string;
}
