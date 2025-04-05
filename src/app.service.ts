import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class AppService {
  private readonly s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  async uploadFileToS3(file: Express.Multer.File): Promise<any> {
    const fileContent = fs.readFileSync(file.path);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `temp/${file.filename}`, // Save in a "temp" folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    try {
      const uploadResult = await this.s3.upload(params).promise();

      // Clean up the local file after upload
      await unlinkAsync(file.path);

      return uploadResult; // Return the file URL
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }
}
