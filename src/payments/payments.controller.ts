import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitiatePaymentDTO } from './dto/initiate-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() initiatePaymentDto: InitiatePaymentDTO) {
    const params = {
      OrderNumber: initiatePaymentDto.OrderNumber,
      OrderAmount: initiatePaymentDto.OrderAmount,
      CustomerName: initiatePaymentDto.CustomerName,
      CustomerMobile: initiatePaymentDto.CustomerMobile,
      CustomerEmail: initiatePaymentDto.CustomerEmail,
      CustomerAddress: initiatePaymentDto.CustomerAddress,
    } as InitiatePaymentDTO;
    return this.paymentsService.initiatePayment(params);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('event/:eventId')
  async getPaymentByEvent(@Param('eventId') eventId: string) {
    // Find the payment record for this event
    return this.paymentsService.findByEventId(eventId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
