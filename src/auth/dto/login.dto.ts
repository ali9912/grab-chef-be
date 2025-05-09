import { IsString, IsNotEmpty, Matches, IsEmail, IsOptional } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fcmToken: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LogoutDto {
  @IsNotEmpty()
  @IsString()
  fcmToken: string;
}
