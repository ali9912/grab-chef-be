import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FolderType } from './common/interfaces/folder.interface';
import { AwsS3Service } from './utils/aws-s3.service';
import { imageFileFilter, documentFileFilter } from './utils/file-upload.utils';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly awsS3Service: AwsS3Service,
  ) { }

  @Post('upload/:folder')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Temporary local storage
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(@Param('folder') folder: FolderType, @UploadedFile() file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    // Upload the file to AWS S3 using the service
    const fileLocation = await this.appService.uploadFileToS3(file, folder);

    return fileLocation;
  }

  @Post('upload/attachment')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        // Allow both images and documents
        imageFileFilter(req, file, (err, pass) => {
          if (pass) return callback(null, true);
          documentFileFilter(req, file, callback);
        });
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    }),
  )
  async uploadAttachment(@UploadedFile() file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    // Upload to S3 in 'attachments' folder
    const url = await this.awsS3Service.upload(file, 'attachments');
    return { url };
  }
}