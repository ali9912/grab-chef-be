import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEmail()
  email?: string;

  @IsString()
  password?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;
}
