import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;
  private readonly logger = new Logger(TwilioService.name);

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials are not provided. SMS sending will be disabled.');
    }
  }

  async sendSMS(to: string, body: string): Promise<any> {
    try {
      if (!this.client) {
        this.logger.warn('Twilio client not initialized. SMS not sent.');
        return;
      }

      const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!from) {
        this.logger.warn('Twilio phone number not provided. SMS not sent.');
        return;
      }

      const message = await this.client.messages.create({
        body,
        from,
        to,
      });

      this.logger.log(`SMS sent to ${to} with SID: ${message.sid}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }
}
