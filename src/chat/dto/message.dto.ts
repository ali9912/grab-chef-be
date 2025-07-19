import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  receiver: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;
}

export class AttachFileDto {
  @IsString()
  @IsNotEmpty()
  receiver: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;
} 