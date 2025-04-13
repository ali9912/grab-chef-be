import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import {
  LocationType,
  LocationDto,
} from 'src/common/interfaces/location.interface';
import { UserRole } from 'src/users/interfaces/user.interface';

export class EditChefDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsOptional()
  profilePicture?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +123456789)',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  idCard: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  certificates: string;

  @IsOptional()
  @IsString()
  experience: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations: LocationType[];
}
