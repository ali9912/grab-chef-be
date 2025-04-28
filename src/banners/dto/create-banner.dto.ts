import { IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  image: string;
}
