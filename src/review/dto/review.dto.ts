import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class ReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsNotEmpty()
  review: string;
}
