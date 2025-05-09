import { IsEmail, IsOptional, IsString } from 'class-validator';

export class EditCustomerDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEmail()
  email?: string;

  @IsOptional()
  profilePicture?: string;
}
