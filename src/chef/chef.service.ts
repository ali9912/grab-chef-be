import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { AwsS3Service } from '../utils/aws-s3.service';
import { Chef, ChefVerificationStatus } from './interfaces/chef.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';
import { extractChefInfo } from 'src/helpers/extract-data';
import { BusyDataDto } from './dto/busy-data-dto';

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

    const query = {
      // status: ChefVerificationStatus.APPROVED,
    };

    const [chefs, totalCount] = await Promise.all([
      this.chefModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('userId')
        .exec(),
      this.chefModel.countDocuments(query).exec(),
    ]);

    const formattedChefs = chefs.map((chef) => ({
      _id: chef.userId._id,
      user: chef.userId,
      chef: {
        idCard: chef.idCard,
        certificates: chef.certificates,
        bio: chef.bio,
        status: chef.status,
        rating: chef.rating,
        experience: chef.experience,
        locations: chef.locations,
        busyDays: chef.busyDays,
      },
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

  async getChefBusySchedule(userId: string) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }
    const busyDays = chef.busyDays;
    return { busyDays, success: true };
  }

  async getChefBusyScheduleById(userId: string) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }
    const busyDays = chef.busyDays;
    return { busyDays, success: true };
  }

  async addEventToChefCalendar(busyDataDto: BusyDataDto, userId: string) {
    console.log('USERID------', userId);
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }
    // Add the new busy day
    const busyDays = await this.addEventToCalendar(chef, busyDataDto);

    return {
      busyDays,
      success: true,
      message: "Chef's schedule updated successfully.",
    };
  }

  async addEventToCalendar(chef: Chef, busyDataDto: BusyDataDto) {
    // Check if the date already exists in the busyDays array
    const existingBusyDay = chef.busyDays.find(
      (day) =>
        day.date.toISOString() === new Date(busyDataDto.date).toISOString(),
    );

    if (existingBusyDay) {
      // Check for overlapping time slots
      const overlappingSlots = busyDataDto.timeSlots.find((slot) => {
        return existingBusyDay.timeSlots.includes(slot);
      });

      if (overlappingSlots) {
        throw new HttpException(
          `Time ${overlappingSlots} slots for this date overlap with existing schedule`,
          HttpStatus.CONFLICT,
        );
      }

      // If no overlap, merge the new time slots with the existing ones
      existingBusyDay.timeSlots.push(...busyDataDto.timeSlots);
      existingBusyDay.timeSlots = [...new Set(existingBusyDay.timeSlots)]; // Ensure uniqueness
    } else {
      // Add the new busy day
      chef.busyDays.push({ ...busyDataDto, date: new Date(busyDataDto.date) });
    }

    await chef.save();
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
