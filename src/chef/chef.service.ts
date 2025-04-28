import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetChefQueryType, PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { AwsS3Service } from '../utils/aws-s3.service';
import { Chef, ChefVerificationStatus } from './interfaces/chef.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';
import { extractChefInfo } from 'src/helpers/extract-data';
import { BusyDataDto } from './dto/busy-data-dto';
import { CreateEmergencyDto } from './dto/-emergency.dto';

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
  async getAllChefs(query: GetChefQueryType) {
    const { page = 1, limit = 10, search, status, latitude, longitude } = query;
    const skip = (page - 1) * Number(limit);

    // Initialize the aggregation pipeline
    const pipeline: any[] = [];

    // Step 1: Handle geoNear if location is provided
    if (latitude != null && longitude != null) {
      // First stage: $geoNear with corrected coordinates array
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point', // Explicitly setting type as 'Point'
            coordinates: [
              parseFloat(`${longitude}`),
              parseFloat(`${latitude}`),
            ], // Ensure coordinates are numbers
          },
          distanceField: 'distance', // Add distance in the result
          spherical: true,
          query: status ? { status } : {}, // Apply status filter if present
        },
      });

      // Step 2: Unwind locations after geoNear to process each location's coordinates
      pipeline.push({ $unwind: '$locations' }); // Unwind the locations array

// <<<<<<< events
      // Step 3: Match only those locations with coordinates (i.e., location is not empty)
      pipeline.push({
        $match: {
          'locations.location.coordinates': { $exists: true, $ne: [] }, // Ensure coordinates exist
        },
      });
    } else {
      // No geoNear filter → apply status filter up-front if given
      if (status) {
        pipeline.push({ $match: { status } });
      }
    }

    // Step 4: Lookup the User document to get firstName, lastName, and profilePicture
    pipeline.push(
      {
        $lookup: {
          from: 'users', // actual collection name
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      }      
      { $unwind: '$user' }, // Unwind the 'user' array after lookup
    );

    // Step 5: If search is present, filter by first or last name (case-insensitive)
    if (search) {
      const regex = new RegExp(search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.firstName': { $regex: regex } },
            { 'user.lastName': { $regex: regex } },
          ],
        },
      });
    }

    // Step 6: If we didn’t do a geoNear, sort by avgRating
    if (!latitude || !longitude) {
      pipeline.push({ $sort: { avgRating: -1 } });
    }


// =======
//     const [chefs, totalCount] = await Promise.all([
//       this.chefModel
//         .find(query)
//         .skip(skip)
//         .limit(limit)
//         .populate('userId')
//         .exec(),
//       this.chefModel.countDocuments(query).exec(),
//     ]);

//     const formattedChefs = chefs.map((chef) => ({
//       _id: chef.userId?._id,
//       user: chef.userId,
//       chef: {
//         idCard: chef.idCard,
//         certificates: chef.certificates,
//         bio: chef.bio,
//         status: chef.status,
//         rating: chef.rating,
//         experience: chef.experience,
//         locations: chef.locations,
//         busyDays: chef.busyDays,
// >>>>>>> main

    // Step 7: Apply pagination and projection
    pipeline.push({
      $facet: {
        metadata: [
          { $count: 'total' }, // totalCount after filters
        ],
        data: [
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 0,
              chefId: '$user._id',
              distance: 1, // Only if geoNear ran
              'user._id': 1,
              'user.firstName': 1,
              'user.lastName': 1,
              'user.profilePicture': 1,
              idCard: 1,
              certificates: 1,
              bio: 1,
              status: 1,
              avgRating: 1,
              experience: 1,
              locations: 1,
              busyDays: 1,
              achievements: 1, // Include achievements if needed
              emergencyContact: 1, // Include emergency contact if needed
              hasAddeddEmergencyContact: 1, // Add if required
            },
          },
        ],
      },
    });

    // Step 8: Execute the aggregation pipeline
    const [result] = await this.chefModel.aggregate(pipeline);

    const totalCount = result.metadata.length ? result.metadata[0].total : 0;

    return {
      chefs: result.data,
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

  async findAndDeleteByUserId(userId: string, data: any = {}) {
    await this.chefModel.findOneAndDelete({ userId });
    return true
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

  async addChefEmergencyContact(
    createEmergencyDto: CreateEmergencyDto,
    userId: string,
  ) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }

    const contacts = await chef.updateOne(
      {
        hasAddeddEmergencyContact: true,
        $addToSet: {
          emergencyContact: { $each: [createEmergencyDto] }, // Add unique items to the achievements array
        },
      },
      { new: true },
    );

    return {
      success: true,
      contacts,
      message: "Chef's emergency contact updated successfully.",
    };
  }

  async getChefEmergencyContacts(userId: string) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      contacts: chef.emergencyContact,
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
