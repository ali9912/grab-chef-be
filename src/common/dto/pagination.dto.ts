import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from 'src/event/interfaces/event.interface';

export class GetChefEventsQueryType {
  @IsString()
  @IsOptional()
  @IsEnum(EventStatus)
  status?: string
}

export class PaginationDto extends GetChefEventsQueryType{
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
