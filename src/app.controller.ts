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

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

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
}