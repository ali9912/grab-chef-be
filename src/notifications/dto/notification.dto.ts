import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class NotificationDto {
  @IsString()
  token: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsOptional()
  data?: any;
}

export class MultipleDeviceNotificationDto extends NotificationDto {
  @IsArray()
  tokens: string[];

  @IsString()
  userId: string;
}
