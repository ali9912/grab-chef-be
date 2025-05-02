import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class IngredientsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  quantity: number; // Changed to number for validation
}

export class AddIngredientsDto {
  @IsArray()
  @Type(() => IngredientsDto) // Transform each item into an instance of IngredientsDto
  @ValidateNested({ each: true }) // Validate each item in the array
  ingredients: IngredientsDto[];
}
