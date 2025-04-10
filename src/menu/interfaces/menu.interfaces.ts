import { Document, Types } from 'mongoose';

export enum MenuItemCategory {
  APPETIZERS = 'appetizers',
  MAIN_COURSE = 'main-course',
  DESSERTS = 'desserts',
  BEVERAGES = 'beverages',
  SIDES = 'sides',
  SALADS = 'salads',
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
