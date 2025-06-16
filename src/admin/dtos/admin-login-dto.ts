import { IsEmail, IsString } from 'class-validator';

export class AdminLoginDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
