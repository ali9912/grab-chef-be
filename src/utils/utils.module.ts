import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { AwsS3Service } from './aws-s3.service';

@Module({
  providers: [TwilioService, AwsS3Service],
  exports: [TwilioService, AwsS3Service],
})
export class UtilsModule {}