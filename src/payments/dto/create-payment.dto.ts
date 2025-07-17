export class CreatePaymentDto {
  eventId: string;
  status?: 'pending' | 'paid' | 'failed';
  orderNumber: string;
  amount: string;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  customerAddress?: string;
  payProOrderId?: string;
  payProResponse?: any;
}