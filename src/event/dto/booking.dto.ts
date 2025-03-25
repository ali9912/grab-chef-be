import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class MenuItemDto {
  @IsMongoId()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

export class BookingDto {
  @IsMongoId()
  @IsNotEmpty()
  chefId: string;

  @IsMongoId()
  @IsNotEmpty()
  locationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  @IsNotEmpty()
  menuItems: MenuItemDto[];

  @IsDateString()
  @IsNotEmpty()
  dateTime: string;

  @IsString()
  @IsOptional()
  specialRequests?: string;
}
