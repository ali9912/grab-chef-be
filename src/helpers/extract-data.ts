import {} from 'mongoose';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';
import { User } from 'src/users/interfaces/user.interface';
import { Chef } from './../chef/interfaces/chef.interface';

export const extractUserInfo = (user: User) => {
  if (!user) return null;
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    customer: user?.customer,
    chef: user?.chef,
  };
};

export const extractChefInfo = (chef: Chef) => {
  if (!chef) return null;
  return {
    userId: chef.userId,
    idCard: chef.idCard,
    certificates: chef.certificates,
    bio: chef.bio,
    status: chef.status,
    rating: chef.avgRating,
    createdAt: chef.createdAt,
    experience: chef.experience,
    locations: chef.locations,
  };
};

export const extractMenuInfo = (menu: MenuItem) => {
  if (!menu) return null;
  return {
    chef: menu.chef,
    title: menu.title,
    description: menu.description,
    price: menu.price,
    images: menu.images,
    category: menu.category,
    isSpecial: menu.isSpecial,
    minOrderQty: menu.minOrderQty,
    _id: menu._id,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
  };
};
