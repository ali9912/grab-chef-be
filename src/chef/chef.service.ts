import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { AwsS3Service } from '../utils/aws-s3.service';
import { Chef, ChefVerificationStatus } from './interfaces/chef.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';
import { extractChefInfo } from 'src/helpers/extract-data';

@Injectable()
export class ChefService {
  constructor(
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    private readonly usersService: UsersService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getChefByUserId(userId: string) {
    return await this.chefModel.findOne({ userId });
  }
  async getAllChefs(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = { status: ChefVerificationStatus.APPROVED };

    const [chefs, totalCount] = await Promise.all([
      this.chefModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .exec(),
      this.chefModel.countDocuments(query).exec(),
    ]);

    const formattedChefs = chefs.map((chef) => ({
      id: chef._id,
      name: `${(chef.userId as any).firstName} ${
        (chef.userId as any).lastName
      }`,
      rating: chef.rating,
    }));

    return {
      chefs: formattedChefs,
      totalCount,
      page,
      limit,
    };
  }

  async getChefStatus(chefId: string) {
    const chef = await this.chefModel.findById(chefId).exec();
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    return { status: chef.status };
  }

  findChefById = async (chefId: string) => {
    return extractChefInfo(await this.chefModel.findById(chefId));
  };

  async findAndUpdateChefByUserId(userId: string, data: any = {}) {
    const isChef = await this.chefModel.find({ userId });
    if (!isChef.length) {
      return await this.chefModel.create({ userId, ...data });
    }
    return await this.chefModel.findOneAndUpdate({ userId }, data, {
      new: true,
    });
  }

  // async addMenuItem(menuItemDto: MenuItemDto) {
  //   const chef = await this.chefModel
  //     .findOne({ userId: menuItemDto.chefId })
  //     .exec();
  //   if (!chef) {
  //     throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
  //   }

  //   if (chef.status !== ChefVerificationStatus.APPROVED) {
  //     throw new HttpException('Chef not approved yet', HttpStatus.FORBIDDEN);
  //   }

  //   const menuItem = new this.menuItemModel({
  //     ...menuItemDto,
  //     chef: chef._id,
  //   });

  //   await menuItem.save();

  //   return { message: 'Menu item added successfully' };
  // }

  // async updateMenuItem(menuItemId: string, menuItemDto: MenuItemDto) {
  //   const menuItem = await this.menuItemModel.findById(menuItemId).exec();
  //   if (!menuItem) {
  //     throw new HttpException('Menu item not found', HttpStatus.NOT_FOUND);
  //   }

  //   const chef = await this.chefModel
  //     .findOne({ userId: menuItemDto.chefId })
  //     .exec();
  //   if (!chef) {
  //     throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
  //   }

  //   // Ensure chef is only updating their own menu items
  //   if (menuItem.chef.toString() !== (chef._id as any).toString()) {
  //     throw new HttpException(
  //       'Not authorized to update this menu item',
  //       HttpStatus.FORBIDDEN,
  //     );
  //   }

  //   // Update menu item
  //   Object.assign(menuItem, {
  //     title: menuItemDto.title,
  //     description: menuItemDto.description,
  //     price: menuItemDto.price,
  //     images: menuItemDto.images,
  //     category: menuItemDto.category,
  //     isSpecial: menuItemDto.isSpecial,
  //     minOrderQty: menuItemDto.minOrderQty,
  //   });

  //   await menuItem.save();

  //   return { message: 'Menu item updated successfully' };
  // }
}
