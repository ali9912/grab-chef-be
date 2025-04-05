import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class RegisterChefDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsString()
  profilePic?: string;
  
  @IsString()
  idCard?: string;

  @IsString()
  zip?: string;
}
