import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from 'src/common/dto/location.dto';

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

  @IsString()
  area: string;

  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  @IsNotEmpty()
  fullAddress: LocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  @IsNotEmpty()
  menuItems: MenuItemDto[];

  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;
}
