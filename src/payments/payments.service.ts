import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitiatePaymentDTO } from './dto/initiate-payment.dto';
import { config } from 'dotenv';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

config();

const DEMO_URL = process.env.PAYMENT_DEMO_URL;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Payments') private readonly paymentModel: Model<any>,
  ) {}

  async initiatePayment(body: InitiatePaymentDTO) {
    const authResponse = await this.getPayProAuth();
    if (!authResponse.success) {
      throw new HttpException(
        'Error getting auth from payment provider',
        HttpStatus.BAD_GATEWAY,
      );
    }
    const authToken = authResponse.token;
    const response = await this.createPayProOrderFetch(body, authToken);

    return response;
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const authResponse = await this.getPayProAuth();
    return 'This action adds a new payment';
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }

  async findByEventId(eventId: string) {
    return this.paymentModel.findOne({ eventId });
  }

  private async getPayProAuth() {
    let data = JSON.stringify({
      clientsecret: process.env.PAYPRO_CLIENT_SECRET,
      clientid: process.env.PAYPRO_CLIENT_ID,
    });
    console.log('===data===>', JSON.parse(data));

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://demoapi.PayPro.com.pk/v2/ppro/auth',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    try {
      const response = await axios.request(config);
      return { token: response.headers?.token, success: true };
    } catch (error) {
      console.log('error auth payment========');
      return { success: false };
    }
  }

  private async createPayProOrderFetch(
    customerData: InitiatePaymentDTO,
    authToken: string,
  ) {
    const payload = [
      { MerchantId: process.env.PAYPRO_USERNAME },
      {
        OrderNumber: customerData.OrderNumber,
        OrderAmount: customerData.OrderAmount,
        OrderDueDate: '23/06/2025',
        OrderType: 'Service',
        IssueDate: '21/05/2025',
        CustomerName: customerData.CustomerName,
        CustomerMobile: customerData.CustomerMobile,
        CustomerEmail: customerData.CustomerEmail,
        CustomerAddress: customerData.CustomerAddress,
      },
    ];

    try {
      const headers = {
        token: authToken,
      };

      try {
        const response = await axios.post(
          'https://demoapi.PayPro.com.pk/v2/ppro/co',
          payload,
          { headers },
        );
        return response.data;
      } catch (error) {
        console.error('Axios error:', error.response?.data || error.message);
        throw error;
      }
    } catch (error) {
      console.error('Fetch error:', error.message);
      throw error;
    }
  }
}
