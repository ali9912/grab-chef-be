import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CuisineEnum } from '../interfaces/menu.interfaces';
import { Type } from 'class-transformer';

export enum ExperienceEnum {
  SENIOR = 'senior',
  JUNIOR = 'junior',
}

export class MenuQueryDto {
  @IsString()
  @IsOptional()
  @IsEnum(CuisineEnum)
  cuisine: string;

  @IsString()
  @IsOptional()
  @IsEnum(ExperienceEnum)
  experience: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rating: number;

  @IsOptional()
  location: string[];

  @IsString()
  @IsOptional()
  search: string;
}
