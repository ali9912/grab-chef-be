import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { GetChefQueryType, PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { AwsS3Service } from '../utils/aws-s3.service';
import {
  Chef,
  ChefVerificationStatus,
  FavouriteChef,
} from './interfaces/chef.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';
import { extractChefInfo } from 'src/helpers/extract-data';
import { BusyDataDto, RemoveDateDto } from './dto/busy-data-dto';
import { CreateEmergencyDto } from './dto/-emergency.dto';
import { Event, EventStatus } from 'src/event/interfaces/event.interface';

@Injectable()
export class ChefService {
  constructor(
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    @InjectModel('FavouriteChef')
    private readonly favouriteChefModel: Model<FavouriteChef>,
    private readonly usersService: UsersService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async getChefByUserId(userId: string) {
    return await this.chefModel.findOne({ userId });
  }

  async getCustomerFavouritesChef(userId: string) {
    const favourites = await this.favouriteChefModel
      .find({ customer: userId })
      .populate({
        path: 'chef', // This is the User
        populate: { path: 'chef', model: 'Chef' }, // Nested population: User.chef
      }) // Populate the chef (User model)
      .populate({
        path: 'customer', // This is the User
        populate: { path: 'customer', model: 'Customer' }, // Nested population: User.chef
      }); // Populate the customer (User model)

    // Format output
    // const formatted = favourites.map((fav) => {
    //   const userDetails = fav.chef.toObject(); // Assuming chef is a User
    //   return {
    //     user: {
    //       ...userDetails,
    //       chef: fav.chef._id,
    //       customer: fav.customer._id,
    //     },
    //   };
    // });

    return { favourites };
  }

  async getAllChefs(query: GetChefQueryType, customerId?: string) {
    const {
      page = 1,
      limit = 10000,
      search,
      status,
      latitude,
      longitude,
    } = query;
    const skip = (page - 1) * Number(limit);

    // Initialize the aggregation pipeline
    const pipeline: any[] = [];

    const customerObjectId = new mongoose.Types.ObjectId(customerId); // required

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
      },
      { $unwind: '$user' }, // Unwind the 'user' array after lookup
    );

    pipeline.push(
      {
        $lookup: {
          from: 'events', // change this if your collection has a different name
          let: { chefId: '$user._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chef', '$$chefId'] }, // match by chef
                    { $eq: ['$status', 'completed'] }, // match completed events
                  ],
                },
              },
            },
          ],
          as: 'completedEvents',
        },
      },
      {
        $addFields: {
          completedEventsCount: { $size: '$completedEvents' },
        },
      },
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

    // Add this ONLY if customerId is provided
    if (customerId) {
      pipeline.push(
        {
          $lookup: {
            from: 'favouritechefs',
            let: { chefUserId: '$user._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chef', '$$chefUserId'] },
                      { $eq: ['$customer', customerObjectId] },
                    ],
                  },
                },
              },
            ],
            as: 'favouriteData',
          },
        },
        {
          $addFields: {
            isFavourite: { $gt: [{ $size: '$favouriteData' }, 0] },
          },
        },
      );
    }

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
              isFavourite: 1,
              completedEventsCount: 1,
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
    return true;
  }

  async getChefBusySchedule(userId: string) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException(
        'Chef with the given user id not exists',
        HttpStatus.NOT_FOUND,
      );
    }
    // Get all confirmed events for this chef
    const confirmedEvents = await this.eventModel.find({
      chef: userId,
      status: EventStatus.CONFIRMED,
    });
    // Mark isEvent: true for slots with a confirmed event
    const busyDays = chef.busyDays.map((busyDay) => {
      const dateStr = new Date(busyDay.date).toISOString().split('T')[0];
      const updatedTimeSlots = busyDay.timeSlots.map((slot) => {
        const hasConfirmed = confirmedEvents.some(
          (event) =>
            new Date(event.date).toISOString().split('T')[0] === dateStr &&
            event.time === slot.time
        );
        return { time: slot.time, isEvent: hasConfirmed ? true : slot.isEvent };
      });
      return { date: busyDay.date, timeSlots: updatedTimeSlots };
    });
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
    // Get all confirmed events for this chef
    const confirmedEvents = await this.eventModel.find({
      chef: userId,
      status: EventStatus.CONFIRMED,
    });
    // Mark isEvent: true for slots with a confirmed event
    const busyDays = chef.busyDays.map((busyDay) => {
      const dateStr = new Date(busyDay.date).toISOString().split('T')[0];
      const updatedTimeSlots = busyDay.timeSlots.map((slot) => {
        const hasConfirmed = confirmedEvents.some(
          (event) =>
            new Date(event.date).toISOString().split('T')[0] === dateStr &&
            event.time === slot.time
        );
        return { time: slot.time, isEvent: hasConfirmed ? true : slot.isEvent };
      });
      return { date: busyDay.date, timeSlots: updatedTimeSlots };
    });
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

    const event = await this.eventModel.findOne({
      chef: userId,
      status: EventStatus.CONFIRMED,
      date: new Date(busyDataDto.date),
    });

    if (event) {
      const alreadyIncluded = busyDataDto.timeSlots.some(
        (slot) => slot.time === event.time,
      );
      if (!alreadyIncluded) {
        busyDataDto.timeSlots.push({
          time: event.time,
          isEvent: true, // mark the event slot
        });
      }
    }

    const busyDays = await this.addEventToCalendar(chef, busyDataDto);

    return {
      busyDays,
      success: true,
      message: "Chef's schedule updated successfully.",
    };
  }

  async removeEventsToChefCalendar(
    removeDateDto: RemoveDateDto,
    userId: string,
  ) {
    const removedSlots: string[] = [];
    const blockedSlots: string[] = [];

    const events = await this.eventModel.find({
      chef: userId,
      status: EventStatus.CONFIRMED,
    });

    const eventsDate = events.map((event) => ({
      time: event.time,
      date: new Date(event.date).toISOString().split('T')[0],
    }));

    const { slots } = removeDateDto;
    const chef = await this.chefModel.findOne({ userId });

    if (!chef?.busyDays?.length) {
      return {
        message: 'Busy slots processed',
        blockedSlots,
        removedSlots,
      };
    }

    const updatedBusyDays = chef.busyDays.map((busyDay) => {
      const busyDateStr = new Date(busyDay.date).toISOString().split('T')[0];
      if (busyDateStr !== slots.date) return busyDay;

      const hasEventForDate = eventsDate.filter((e) => e.date === slots.date);
      let updatedTimeSlots = [...busyDay.timeSlots];

      slots.timeSlots.forEach((slot) => {
        const isBlocked = hasEventForDate.some((e) => e.time === slot.time);

        const exists = updatedTimeSlots.find((t) => t.time === slot.time);
        if (exists && !isBlocked) {
          removedSlots.push(slot.time);
          updatedTimeSlots = updatedTimeSlots.filter(
            (t) => t.time !== slot.time,
          );
        } else if (exists) {
          blockedSlots.push(slot.time);
          console.log(
            'EVENT EXISTS',
            hasEventForDate.find((e) => e.time === slot.time),
          );
        }
      });

      return updatedTimeSlots.length
        ? { ...busyDay, timeSlots: updatedTimeSlots }
        : null;
    });

    chef.busyDays = updatedBusyDays.filter(Boolean); // Remove null entries
    console.log('===chef.busyDays===>', JSON.stringify(chef.busyDays, null, 1));

    await chef.save();

    return {
      message: 'Busy slots processed',
      blockedSlots,
      removedSlots,
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
    const eventDateISO = new Date(busyDataDto.date).toISOString();

    const existingBusyDay = chef.busyDays.find(
      (day) => day.date.toISOString() === eventDateISO,
    );

    if (existingBusyDay) {
      for (const newSlot of busyDataDto.timeSlots) {
        const existingSlot = existingBusyDay.timeSlots.find(
          (slot) => slot.time === newSlot.time,
        );

        if (existingSlot) {
          if (existingSlot.isEvent && newSlot.isEvent) {
            throw new Error(`Event already exists for time ${newSlot.time}`);
          }

          if (newSlot.isEvent) {
            existingSlot.isEvent = true;
          }
          // If not an event, no update needed
        } else {
          // Add new slot
          existingBusyDay.timeSlots.push({
            time: newSlot.time,
            isEvent: newSlot.isEvent ?? false,
          });
        }
      }

      // Enforce uniqueness by time (if needed again for safety)
      const slotMap: Record<string, { time: string; isEvent: boolean }> = {};
      for (const slot of existingBusyDay.timeSlots) {
        slotMap[slot.time] = slot; // overwrites duplicates
      }
      existingBusyDay.timeSlots = Object.values(slotMap);
    } else {
      // Create new day entry
      const newDay = {
        date: new Date(busyDataDto.date),
        timeSlots: busyDataDto.timeSlots.map((slot) => ({
          time: slot.time,
          isEvent: slot.isEvent ?? false,
        })),
      };

      chef.busyDays.push(newDay);
    }

    await chef.save();
  }

  async addToFavourite(customerId: string, chefId: string) {
    const exists = await this.favouriteChefModel.findOne({
      customer: customerId,
      chef: chefId,
    });

    if (exists) {
      throw new HttpException(
        'Chef already added to favourites',
        HttpStatus.BAD_REQUEST,
      );
    }

    const favourite = await this.favouriteChefModel.create({
      customer: customerId,
      chef: chefId,
    });

    return { success: true, message: 'Added to favourites.' };
  }

  async removeFromFavourite(customerId: string, chefId: string) {
    const result = await this.favouriteChefModel.findOneAndDelete({
      customer: customerId,
      chef: chefId,
    });

    if (!result) {
      throw new HttpException(
        'Chef not found in favourites',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { message: 'Chef removed from favourites' };
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
