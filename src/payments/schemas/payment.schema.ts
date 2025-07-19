import * as mongoose from 'mongoose';

export const PaymentSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  orderNumber: { type: String, required: true },
  amount: { type: String, required: true },
  customerName: { type: String },
  customerMobile: { type: String },
  customerEmail: { type: String },
  customerAddress: { type: String },
  payProOrderId: { type: String },
  payProResponse: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
