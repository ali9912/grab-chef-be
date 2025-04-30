import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  Min,
} from 'class-validator';
import { CuisineEnum, MenuItemCategory } from '../interfaces/menu.interfaces';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  images: string[];

  @IsEnum(MenuItemCategory)
  @IsNotEmpty()
  category: MenuItemCategory;

  @IsEnum(CuisineEnum)
  @IsNotEmpty()
  cuisine: MenuItemCategory;

  @IsBoolean()
  @IsOptional()
  isSpecial?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;
}
