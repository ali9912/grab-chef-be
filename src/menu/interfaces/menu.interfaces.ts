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
  cuisine:
    | 'Pakistani'
    | 'Chinese'
    | 'Italian'
    | 'Korean'
    | 'Indian'
    | 'Pasta'
    | 'Pizza'
    | 'Biryani';
}

// REMINDER: if you are updating here, update in MenuQueryDto tooo...
export enum CuisineEnum {
  PAKISTANI = 'Pakistani',
  CHINESE = 'Chinese',
  ITALIAN = 'Italian',
  KOREAN = 'Korean',
  INDIAN = 'Indian',

  PASTA = 'Pasta',
  PIZZA = 'Pizza',
  BIRYANI = 'Biryani',
}
