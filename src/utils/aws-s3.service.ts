import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AwsS3Service {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly logger = new Logger(AwsS3Service.name);

  constructor(private readonly configService: ConfigService) {
    AWS.config.update({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });

    this.s3 = new AWS.S3();
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const uploadParams = {
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await this.s3.upload(uploadParams).promise();
      this.logger.log(`File uploaded successfully to ${result.Location}`);
      return result.Location;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw error;
    }
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const parsedUrl = new URL(fileUrl);
      const key = parsedUrl.pathname.substring(1); // Remove leading slash

      const deleteParams = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`File deleted successfully: ${fileUrl}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`);
      throw error;
    }
  }
}
