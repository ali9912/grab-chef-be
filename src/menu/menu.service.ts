import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChefService } from 'src/chef/chef.service';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { User } from 'src/users/interfaces/user.interface';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuItem } from './interfaces/menu.interfaces';
import { RandomMenuDto } from './dto/random-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly chefService: ChefService,
  ) {}
  /* 
      API REQUESTS FOR CHEFS ONLY 
  */
  async create(createMenuDto: CreateMenuDto, userInfo: User) {
    const userId = userInfo._id.toString();
    const menu = await this.menuModel.create({
      ...createMenuDto,
      chef: userId,
    });
    return {
      menu,
      message: 'Menu has been created successfully',
      success: true,
    };
  }

  async update(menuId: string, updateMenuDto: UpdateMenuDto, userInfo: User) {
    const menu = await this.menuModel.findByIdAndUpdate(
      menuId,
      {
        ...updateMenuDto,
      },
      { new: true },
    );

    await menu.save();

    return {
      menu,
      message: 'Menu has been edited successfully',
      success: true,
    };
  }

  async getCurrentChefMenus(userInfo: User) {
    const userId = userInfo._id.toString();
    const menus = await this.menuModel.find({ chef: userId });
    return { menus, success: true };
  }

  async getMenuById(id: string) {
    try {
      return await this.menuModel.findById(id).exec();
    } catch (error) {
      if (error.name === 'CastError') {
        // Handle invalid ObjectId format
        throw new HttpException('No item found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'An error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string) {
    try {
      const res = await this.menuModel
        .findByIdAndDelete(id, { new: true })
        .exec();
      return { success: true, message: 'Memu deleted successfully' };
    } catch (error) {
      if (error.name === 'CastError') {
        // Handle invalid ObjectId format
        throw new HttpException('No item found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'An error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteByChefId(userId: string) {
    try {
      const result = await this.menuModel.deleteMany({ chef: userId }).exec();

      if (result.deletedCount === 0) {
        throw new HttpException(
          'No menus found for the given chef',
          HttpStatus.NOT_FOUND,
        );
      }

      return { success: true, message: 'Menus deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'An error occurred while deleting menus',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* 
      API REQUESTS FOR CUSTOMERS ONLY 
  */

  async getAllMenuByChef(userId: string) {
    const menus = await this.menuModel.find({ chef: userId });
    return { menus, success: true };
  }

  async getRandomMenu(queryData: RandomMenuDto) {
    const menus = await this.menuModel.aggregate([
      {
        $lookup: {
          from: 'chefs',
          localField: 'chef', // Menu.chef (ObjectId of User)
          foreignField: 'userId', // Chef.userId (also ObjectId of User)
          as: 'chefDetails',
        },
      },
      { $unwind: '$chefDetails' },

      {
        $lookup: {
          from: 'users',
          localField: 'chefDetails.userId', // Now get actual user info
          foreignField: '_id',
          as: 'chefUserDetails',
        },
      },
      { $unwind: '$chefUserDetails' },

      {
        $sort: { 'chefDetails.avgRating': -1 },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          description: 1,
          price: 1,
          images: 1,

          'chefDetails.avgRating': 1,

          // User details
          'chefUserDetails.firstName': 1,
          'chefUserDetails.lastName': 1,
          'chefUserDetails.profilePicture': 1,
        },
      },
    ]);

    return { menus, success: true };
  }
}
