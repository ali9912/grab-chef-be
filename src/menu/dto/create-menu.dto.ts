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
import { MenuItemCategory } from '../interfaces/menu.interfaces';

export class CreateMenuDto {
  @IsMongoId()
  @IsNotEmpty()
  chefId: string;

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

  @IsBoolean()
  @IsOptional()
  isSpecial?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minOrderQty?: number;
}
