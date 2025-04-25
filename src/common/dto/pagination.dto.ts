import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from 'src/event/interfaces/event.interface';
import { LocationType } from '../interfaces/location.interface';
import { LocationDto } from './location.dto';

export class PaginationDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// export class GetChefQueryType extends PaginationDto {
//   @IsString()
//   @IsOptional()
//   @IsEnum(EventStatus)
//   status: string;

//   @IsString()
//   @IsOptional()
//   search: string;

//   @IsString()
//   @IsOptional()
//   location: {
//     latitude: number;
//     longitude: number;
//   };
// }

export type GetChefQueryType = {
  search?: string;
  status?: EventStatus;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
};
