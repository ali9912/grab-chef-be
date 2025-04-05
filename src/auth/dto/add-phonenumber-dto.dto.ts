import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class AddPhoneNumberDTO {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +123456789)',
  })
  phoneNumber: string;
}
