import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class RegisterChefDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  cuisine: string;

  @IsString()
  @IsNotEmpty()
  bio: string;
}
