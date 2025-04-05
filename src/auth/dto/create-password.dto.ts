// createPasswordDto
import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';

export class CreatePasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
