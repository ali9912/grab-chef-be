import { IsNotEmpty, IsString } from 'class-validator';

export class LoginWithPhoneDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
