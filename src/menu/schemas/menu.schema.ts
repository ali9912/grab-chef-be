import * as mongoose from 'mongoose';
import { MenuItemCategory } from '../interfaces/menu.interfaces';
import { Chef } from 'src/chef/interfaces/chef.interface';

export const MenuSchema = new mongoose.Schema({
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [
    {
      type: String,
    },
  ],
  category: {
    type: String,
    enum: Object.values(MenuItemCategory),
    required: true,
  },
  isSpecial: {
    type: Boolean,
    default: false,
  },
  minOrderQty: {
    type: Number,
    default: 1,
    min: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

MenuSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
