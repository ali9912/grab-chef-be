import { Document, Types } from 'mongoose';

export enum MenuItemCategory {
  APPETIZERS = 'Appetizers',
  MAIN_COURSE = 'Main Course',
  DESSERTS = 'Desserts',
  BEVERAGES = 'Beverages',
  SIDES = 'Sides',
}

export interface MenuItem extends Document {
  chef: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: MenuItemCategory;
  isSpecial: boolean;
  minOrderQty: number;
  createdAt: Date;
  updatedAt: Date;
}
