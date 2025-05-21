import { IsString } from 'class-validator';

export class InitiatePaymentDTO {
  @IsString()
  OrderNumber: string;

  @IsString()
  OrderAmount: string;

  @IsString()
  // OrderDueDate: string;

  // @IsString()
  // OrderType: 'Service';

  // @IsString()
  // IssueDate: string;

  @IsString()
  CustomerName: string;

  @IsString()
  CustomerMobile: string;

  @IsString()
  CustomerEmail: string;

  @IsString()
  CustomerAddress: string;
}
