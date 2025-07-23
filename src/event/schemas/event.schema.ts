import * as mongoose from 'mongoose';
import { LocationSchema } from 'src/common/schemas/location.schema';
import { AttendanceStatus, EventStatus } from '../interfaces/event.interface';

export const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 100000 }, // Start from 100000
});

const MenuSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1,
  },
});

const InvoiceSchema = new mongoose.Schema({
  advanceAmount: { type: Number },
  customerName: { type: String },
  date: { type: Date },
  time: { type: String },
  numberOfPeople: { type: Number },
  dishTitle: { type: String },
  totalAmount: { type: Number },
  remainingAmount: { type: Number },
});

const AttendanceSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(AttendanceStatus),
    required: true,
  },
  location: LocationSchema,
  markedAt: {
    type: Date,
    default: Date.now,
  },
});

export const EventSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  area: { type: String, required: true },

  fullAddress: LocationSchema,

  menuItems: [MenuSchema],

  ingredients: [IngredientSchema],

  orderId: {
    type: Number,
    unique: true,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.PENDING,
  },

  rejectionReason: {
    type: String,
  },

  attendance: [AttendanceSchema],

  invoice: [InvoiceSchema],

  totalAmount: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  cancelReason: {
    type: String,
    required: false,
    default: null,
  },
});

export const Counter = mongoose.model('Counter', CounterSchema);

// Pre-save hook to generate incremental orderId

// Pre-save hook to calculate total amount and tax
// EventSchema.pre('save', async function (next) {
//   this.updatedAt = new Date();

//   // Calculate totals if menuItems exist and are being modified
//   if (this.isModified('menuItems')) {
//     let total = 0;

//     // For simplicity, we're not fetching real menu item prices from the database here
//     // In a real application, you would need to fetch the actual prices
//     this.menuItems.forEach((item) => {
//       // Assuming a placeholder price calculation
//       // In practice, you'd query the MenuItem model to get actual prices
//       total += item.quantity * 10; // Placeholder price of 10 per item
//     });

//     this.totalAmount = total;
//   }

//   next();
// });
