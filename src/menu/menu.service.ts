import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChefService } from 'src/chef/chef.service';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { User } from 'src/users/interfaces/user.interface';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuItem } from './interfaces/menu.interfaces';
import { MenuQueryDto } from './dto/random-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Customer') private readonly customerModel: Model<any>,
    private readonly chefService: ChefService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send notifications to customers in the area about new dishes
   */
  private async sendNewDishNotifications(menu: MenuItem, chef: Chef) {
    try {
      // Get chef's locations
      const chefLocations = chef.locations?.filter(loc => loc.location?.coordinates) || [];
      
      if (chefLocations.length === 0) {
        console.log('Chef has no location coordinates, skipping notifications');
        return;
      }

      // Find customers within 50km radius of any chef location
      const maxDistance = 50000; // 50km in meters
      
      for (const chefLocation of chefLocations) {
        const coordinates = chefLocation.location.coordinates;
        
        // Ensure coordinates has exactly 2 elements [longitude, latitude]
        if (!coordinates || coordinates.length !== 2) continue;
        
        // Find customers near this location using geospatial query
        const nearbyCustomers = await this.customerModel.aggregate([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [coordinates[0], coordinates[1]] as [number, number]
              },
              distanceField: 'distance',
              spherical: true,
              maxDistance: maxDistance,
              query: {
                // Only get customers with valid location coordinates
                'locations.location.coordinates': { $exists: true, $ne: [] }
              }
            }
          },
          {
            $limit: 100 // Limit to prevent spam
          }
        ]);

        if (nearbyCustomers.length === 0) continue;

        // Get user tokens for push notifications
        const customerUserIds = nearbyCustomers.map(c => c.userId.toString());
        const users = await this.userModel.find({
          _id: { $in: customerUserIds },
          fcmTokens: { $exists: true, $ne: null }
        });

        if (users.length === 0) continue;

        const tokens = users.flatMap(u => u.fcmTokens || []).filter(Boolean);
        
        if (tokens.length === 0) continue;
        
        // Send notification to nearby customers
        await this.notificationsService.sendNotificationToMultipleTokens({
          tokens,
          title: 'New Dish Available! 🍽️',
          body: `Chef ${chef.userId ? 'in your area' : 'nearby'} just added "${menu.title}" to their menu. Check it out!`,
          data: {
            type: 'new_dish',
            menuId: menu._id.toString(),
            chefId: chef._id.toString(),
            dishName: menu.title
          },
          userId: 'system', // System notification
          token: tokens[0] // Required by base class
        });

        console.log(`Sent new dish notifications to ${tokens.length} customers near ${chefLocation.name}`);
      }
    } catch (error) {
      console.error('Error sending new dish notifications:', error);
      // Don't throw error to avoid breaking menu creation
    }
  }

  /**
   * Send notifications to customers in the area about updated dishes
   */
  private async sendUpdatedDishNotifications(menu: MenuItem, chef: Chef, isSpecialDish: boolean = false) {
    try {
      // Get chef's locations
      const chefLocations = chef.locations?.filter(loc => loc.location?.coordinates) || [];
      
      if (chefLocations.length === 0) {
        console.log('Chef has no location coordinates, skipping notifications');
        return;
      }

      // Find customers within 30km radius of any chef location (closer for updates)
      const maxDistance = 30000; // 30km in meters
      
      for (const chefLocation of chefLocations) {
        const coordinates = chefLocation.location.coordinates;
        
        // Ensure coordinates has exactly 2 elements [longitude, latitude]
        if (!coordinates || coordinates.length !== 2) continue;
        
        // Find customers near this location using geospatial query
        const nearbyCustomers = await this.customerModel.aggregate([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [coordinates[0], coordinates[1]] as [number, number]
              },
              distanceField: 'distance',
              spherical: true,
              maxDistance: maxDistance,
              query: {
                // Only get customers with valid location coordinates
                'locations.location.coordinates': { $exists: true, $ne: [] }
              }
            }
          },
          {
            $limit: 50 // Limit to prevent spam for updates
          }
        ]);

        if (nearbyCustomers.length === 0) continue;

        // Get user tokens for push notifications
        const customerUserIds = nearbyCustomers.map(c => c.userId.toString());
        const users = await this.userModel.find({
          _id: { $in: customerUserIds },
          fcmTokens: { $exists: true, $ne: null }
        });

        if (users.length === 0) continue;

        const tokens = users.flatMap(u => u.fcmTokens || []).filter(Boolean);
        
        if (tokens.length === 0) continue;
        
        const title = isSpecialDish ? 'Special Dish Update! ⭐' : 'Dish Updated! 🔄';
        const body = isSpecialDish 
          ? `Chef nearby just updated "${menu.title}" - it's now a special dish! Don't miss out!`
          : `Chef nearby just updated "${menu.title}" on their menu. Check out the changes!`;
        
        // Send notification to nearby customers
        await this.notificationsService.sendNotificationToMultipleTokens({
          tokens,
          title,
          body,
          data: {
            type: 'updated_dish',
            menuId: menu._id.toString(),
            chefId: chef._id.toString(),
            dishName: menu.title,
            isSpecial: isSpecialDish
          },
          userId: 'system', // System notification
          token: tokens[0] // Required by base class
        });

        console.log(`Sent updated dish notifications to ${tokens.length} customers near ${chefLocation.name}`);
      }
    } catch (error) {
      console.error('Error sending updated dish notifications:', error);
      // Don't throw error to avoid breaking menu updates
    }
  }

  /**
   * Send random notifications about new dishes from chefs in a customer's area
   * This method can be called periodically (e.g., daily) to engage customers
   */
  async sendRandomDishNotifications() {
    try {
      // Get all customers with valid location coordinates
      const customersWithLocations = await this.customerModel.aggregate([
        {
          $match: {
            'locations.location.coordinates': { $exists: true, $ne: [] }
          }
        },
        {
          $limit: 1000 // Process in batches
        }
      ]);

      let notificationsSent = 0;

      for (const customer of customersWithLocations) {
        try {
          // Get customer's primary location
          const customerLocation = customer.locations.find(loc => loc.location?.coordinates);
          if (!customerLocation?.location?.coordinates) continue;

          const coordinates = customerLocation.location.coordinates;
          if (coordinates.length !== 2) continue;

          // Find chefs within 50km radius
          const maxDistance = 50000; // 50km in meters
          
          const nearbyChefs = await this.chefModel.aggregate([
            {
              $geoNear: {
                near: {
                  type: 'Point',
                  coordinates: [coordinates[0], coordinates[1]] as [number, number]
                },
                distanceField: 'distance',
                spherical: true,
                maxDistance: maxDistance,
                query: {
                  status: 'approved', // Only approved chefs
                  'locations.location.coordinates': { $exists: true, $ne: [] }
                }
              }
            },
            {
              $limit: 5 // Limit to 5 nearby chefs
            }
          ]);

          if (nearbyChefs.length === 0) continue;

          // Randomly select a chef and get their recent menus
          const randomChef = nearbyChefs[Math.floor(Math.random() * nearbyChefs.length)];
          
          // Get recent menus from this chef (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentMenus = await this.menuModel.find({
            chef: randomChef.userId,
            createdAt: { $gte: sevenDaysAgo }
          }).limit(3);

          if (recentMenus.length === 0) continue;

          // Randomly select a menu
          const randomMenu = recentMenus[Math.floor(Math.random() * recentMenus.length)];
          
          // Get customer's user info for FCM tokens
          const user = await this.userModel.findById(customer.userId);
          if (!user?.fcmTokens?.length) continue;

          // Send notification (30% chance to avoid spam)
          if (Math.random() < 0.3) {
            await this.notificationsService.sendNotificationToMultipleTokens({
              tokens: user.fcmTokens,
              title: 'Discover New Dishes Near You! 🍽️',
              body: `Chef nearby just added "${randomMenu.title}" - a delicious ${randomMenu.category} dish! Check it out!`,
              data: {
                type: 'discovery_dish',
                menuId: randomMenu._id.toString(),
                chefId: randomChef._id.toString(),
                dishName: randomMenu.title,
                category: randomMenu.category
              },
              userId: 'system',
              token: user.fcmTokens[0]
            });

            notificationsSent++;
          }
        } catch (error) {
          console.error(`Error sending random notification to customer ${customer._id}:`, error);
          continue;
        }
      }

      console.log(`Sent ${notificationsSent} random dish discovery notifications`);
      return { success: true, notificationsSent };
    } catch (error) {
      console.error('Error sending random dish notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /* 
      API REQUESTS FOR CHEFS ONLY 
  */
  async create(createMenuDto: CreateMenuDto, userInfo: User) {
    const userId = userInfo._id.toString();
    const menu = await this.menuModel.create({
      ...createMenuDto,
      chef: userId,
    });

    // Send notifications to nearby customers about the new dish
    try {
      const chef = await this.chefModel.findOne({ userId });
      if (chef) {
        await this.sendNewDishNotifications(menu, chef);
      }
    } catch (error) {
      console.error('Error sending notifications for new menu:', error);
      // Don't fail menu creation if notifications fail
    }

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

    // Optionally send notifications about updated dishes
    try {
      const chef = await this.chefModel.findOne({ userId: userInfo._id });
      if (chef) {
        // Check if this is a special dish update
        const isSpecialDish = updateMenuDto.isSpecial || 
                             (updateMenuDto.price && updateMenuDto.price > 0); // Example logic
        
        // Only send notifications for significant updates to avoid spam
        if (isSpecialDish || updateMenuDto.title || updateMenuDto.description) {
          await this.sendUpdatedDishNotifications(menu, chef, isSpecialDish);
        }
      }
    } catch (error) {
      console.error('Error sending notifications for updated menu:', error);
      // Don't fail menu update if notifications fail
    }

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
  async getMenuList(queryData: MenuQueryDto) {
    const { cuisine, experience, rating, location, search } = queryData;

    const locationQuery = location
      ? Array.isArray(location)
        ? location
        : [location]
      : [];

    const matchStage: any = {};

    if (cuisine) {
      matchStage.cuisine = cuisine;
    }

    if (search) {
      matchStage.title = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    const pipeline: any[] = [
      { $match: matchStage },

      {
        $lookup: {
          from: 'chefs',
          localField: 'chef',
          foreignField: 'userId',
          as: 'chefData',
        },
      },
      { $unwind: '$chefData' },

      // Filtering based on chef's experience and rating
      {
        $match: {
          ...(rating && { 'chefData.avgRating': { $gte: rating } }),

          ...(experience === 'junior' && { 'chefData.experience': { $lt: 5 } }),
          ...(experience === 'senior' && { 'chefData.experience': { $gt: 5 } }),

          ...(location &&
            Array.isArray(locationQuery) && {
              $or: locationQuery.map((loc) => ({
                'chefData.locations.name': { $regex: loc, $options: 'i' },
              })),
            }),
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'chefData.userId',
          foreignField: '_id',
          as: 'chefUserDetails',
        },
      },
      { $unwind: '$chefUserDetails' },

      { $sort: { 'chefData.avgRating': -1 } },

      {
        $project: {
          _id: 0,
          title: 1,
          description: 1,
          cuisine: 1,
          price: 1,
          images: 1,

          // Embed avgRating inside chefUserDetails
          chefUserDetails: {
            firstName: '$chefUserDetails.firstName',
            lastName: '$chefUserDetails.lastName',
            profilePicture: '$chefUserDetails.profilePicture',
            avgRating: '$chefData.avgRating',
            locations: '$chefData.locations',
            experience: '$chefData.experience',
          },
        },
      },
    ];

    const menus = await this.menuModel.aggregate(pipeline);

    return { menus };
  }

  async getRandomMenu() {
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
          cuisine: 1,
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
