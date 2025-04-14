import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import { promisify } from 'util';
import { FolderType } from './common/interfaces/folder.interface';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class AppService {

  constructor(
    // @InjectModel('User') private readonly userModel: Model<User>
    private readonly configService: ConfigService,

  ) { }

  private readonly s3 = new AWS.S3({
    accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
    secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
    region: this.configService.get("AWS_REGION"),
  });

  async uploadFileToS3(file: Express.Multer.File, folder: FolderType = "temp"): Promise<any> {
    const fileContent = fs.readFileSync(file.path);

    const params = {
      Bucket: this.configService.get("AWS_S3_BUCKET"),
      Key: `${folder}/${file.filename}`, // Save in a "temp" folder
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
