import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AdminLoginDTO } from './dtos/admin-login-dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage } from 'mongoose';
import {
  Chef,
  ChefVerificationStatus,
} from 'src/chef/interfaces/chef.interface';
import {
  AttendanceStatus,
  Event,
  EventStatus,
  MenuItem,
} from 'src/event/interfaces/event.interface';
import { ChefService } from 'src/chef/chef.service';
import { AchievementsService } from 'src/achievements/achievements.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User, UserRole } from 'src/users/interfaces/user.interface';
import { JwtService } from '@nestjs/jwt';
import { AdminRegisterDTO } from './dtos/admin-register-dto';
import { comparePassword } from 'src/helpers/password-helper';
import { Review } from 'src/review/interfaces/review.interface';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,
    @InjectModel('Review') private readonly reviewModel: Model<Review>,

    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(loginAdminDto: AdminLoginDTO) {
    const user = await this.userModel.findOne({
      email: loginAdminDto.email,
      role: UserRole.ADMIN,
    });
    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }
    const token = this.generateToken(user);

    return {
      token,
      user,
      message: 'Admin login successfully',
    };
  }

  async registerAdmin(adminRegisterDTO: AdminRegisterDTO) {
    const user = await this.userModel.findOne({
      email: adminRegisterDTO.email,
      role: UserRole.ADMIN,
    });
    if (user) {
      throw new HttpException('User already exists.', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.userModel.create({
      ...adminRegisterDTO,
      role: UserRole.ADMIN,
    });

    const token = this.generateToken(newUser);

    return {
      token,
      user: newUser,
      message: 'Admin Registered successfully',
    };
  }

  async getDashboardAnalytics() {
    const totalMenu = await this.menuModel.find().countDocuments();
    const totalOrders = await this.eventModel.find().countDocuments();
    const totalCustomer = await this.userModel
      .find({ role: UserRole.CUSTOMER })
      .countDocuments();
    const totalChef = await this.userModel
      .find({ role: UserRole.CHEF })
      .countDocuments();

    return { totalMenu, totalChef, totalCustomer, totalOrders };
  }

  async getTopRatedChef() {
    const topRatedChef = await this.chefModel
      .find({ avgRating: { $gt: 0 } })
      .sort({ avgRating: -1, noOfReviews: -1 }) // Sort by rating, then by review count
      // .limit(limit)
      .populate('userId') // Optional: Populate user info
      .lean();

    return { topRatedChef };
  }

  async getAllCustomers() {
    const customers = await this.userModel
      .find({ role: UserRole.CUSTOMER })
      .populate('customer');
    return { customers };
  }

  async getAllChefs() {
    const chef = await this.userModel
      .find({ role: UserRole.CHEF })
      .populate('chef');
    return { chef };
  }

  async getChefRequests() {
    const chef = await this.chefModel
      .find({ status: ChefVerificationStatus.PENDING })
      .populate('userId');
    return { chef };
  }

  async updateChefStatus(userId: string, status: ChefVerificationStatus) {
    const chef = await this.chefModel.findOne({ userId });
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }
    await chef.updateOne({ status }, { new: true });
    await chef.save();
    if (status === ChefVerificationStatus.APPROVED) {
      // send notification
    } else if (status === ChefVerificationStatus.REJECTED) {
      // send notification
    }
    return { message: 'Chef status updated.' };
  }

  async getCustomerById(userId: string) {
    const customer = await this.userModel.findById(userId).populate('customer');
    return { customer };
  }

  async getChefById(userId: string) {
    const chef = await this.userModel.findById(userId).populate('chef');
    return { chef };
  }

  async getAllEvent() {
    const events = await this.eventModel
      .find()
      .populate([
        { path: 'customer' },
        {
          path: 'chef',
          populate: { path: 'chef' }, // 👈 nested population inside chef
        },
      ])
      .lean();
    return { events };
  }

  async getEventById(eventId: string) {
    const event = await this.eventModel
      .findById(eventId)
      .populate({
        path: 'chef',
        populate: {
          path: 'chef', // This is the user reference inside the chef schema
          model: 'Chef', // The model name for users
        },
      })
      .populate('customer')
      .populate({
        path: 'menuItems.menuItemId', // Populate menuItemId inside menuItems
        model: 'Menu', // Reference the MenuItem model
      })
      .populate('ingredients')
      .exec();
    return { event };
  }

  async getUserUpcomingEvent(userId: string) {
    const user = await this.userModel.findById(userId);
    const query = {
      status: EventStatus.CONFIRMED,
      ...(user.role === UserRole.CUSTOMER && { customer: user._id }),
      ...(user.role === UserRole.CHEF && { chef: user._id }),
    };
    const events = await this.eventModel
      .find(query)
      .populate([
        { path: 'customer' },
        {
          path: 'chef',
          populate: { path: 'chef' }, // 👈 nested population inside chef
        },
        {
          path: 'menuItems.menuItemId', // 👈 nested path in array
        },
        {
          path: 'ingredients',
        },
      ])
      .lean();
    return { events };
  }

  async getReviews() {
    const reviews = await this.reviewModel
      .find()
      .populate(['event', 'chef', 'customer']);
    return { reviews };
  }

  async updateReviewStatus(reviewId: string, status: boolean) {
    const reviews = await this.reviewModel
      .findByIdAndUpdate(
        reviewId,
        { showInApp: status, statusUpdated: true },
        { new: true },
      )
      .populate(['event', 'chef', 'customer']);
    return { reviews };
  }

  async getRevenueStats() {
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart.getTime() - 1);

    const todayResult = await this.eventModel.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const yesterdayResult = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const monthlyRevenue = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: yearStart, $lte: yearEnd },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          total: { $sum: '$totalAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          total: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthlyRevenueNormalized = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyRevenue.find((m) => m.month === i + 1);
      return {
        month: monthNames[i],
        total: monthData?.total || 0,
      };
    });

    const todayRevenue = todayResult[0]?.total || 0;
    const yesterdayRevenue = yesterdayResult[0]?.total || 0;
    const difference = todayRevenue - yesterdayRevenue;
    const percentageChange =
      yesterdayRevenue === 0
        ? todayRevenue > 0
          ? 100
          : 0
        : (difference / yesterdayRevenue) * 100;

    return {
      todayRevenue,
      yesterdayRevenue,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend:
        percentageChange > 0
          ? 'increase'
          : percentageChange < 0
          ? 'decrease'
          : 'no change',
      monthlyRevenue: monthlyRevenueNormalized,
    };
  }

  async getEventChefLocation(eventId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new HttpException('No Event found', HttpStatus.BAD_REQUEST);
    }
    const attendance = event.attendance;

    const attended = event.attendance?.find(
      (a) => a.status === AttendanceStatus.ATTENDED,
    );

    const checkout = event.attendance?.find(
      (a) => a.status === AttendanceStatus.CHECK_OUT,
    );

    if (!attended || !checkout) {
      return {
        attendance,
        durationMinutes: 0,
      };
    }

    const attendedAt = new Date(attended.markedAt);
    const checkoutAt = new Date(checkout.markedAt);

    const diffMs = checkoutAt.getTime() - attendedAt.getTime();
    const durationMinutes = Math.round(diffMs / 60000);

    return { attendance, durationMinutes };
  }

  async getRepeatingCustomers() {
    const pipeline: PipelineStage[] = [
      // Group by customer + chef to count bookings per pair
      {
        $group: {
          _id: {
            customer: '$customer',
            chef: '$chef',
          },
          count: { $sum: 1 },
        },
      },
      // Group by customer to get total bookings and repeated chefs
      {
        $group: {
          _id: '$_id.customer',
          totalBookings: { $sum: '$count' },
          repeatChefs: {
            $push: {
              chef: '$_id.chef',
              count: '$count',
            },
          },
        },
      },
      // Filter repeatBookings with same chef (> 1)
      {
        $addFields: {
          repeatBookings: {
            $filter: {
              input: '$repeatChefs',
              as: 'r',
              cond: { $gt: ['$$r.count', 1] },
            },
          },
        },
      },
      // Only include customers with ≥ 3 total or repeated bookings
      {
        $match: {
          $or: [
            { totalBookings: { $gte: 3 } },
            { 'repeatBookings.0': { $exists: true } },
          ],
        },
      },
      // Lookup customer details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $addFields: {
          customerName: {
            $concat: ['$customer.firstName', ' ', '$customer.lastName'],
          },
          customerProfilePicture: '$customer.profilePicture',
        },
      },
      // Unwind repeatBookings to enrich each with chef info
      {
        $unwind: {
          path: '$repeatBookings',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'repeatBookings.chef',
          foreignField: '_id',
          as: 'repeatBookings.chefDetails',
        },
      },
      {
        $unwind: {
          path: '$repeatBookings.chefDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'repeatBookings.chefName': {
            $concat: [
              '$repeatBookings.chefDetails.firstName',
              ' ',
              '$repeatBookings.chefDetails.lastName',
            ],
          },
          'repeatBookings.chefProfilePicture':
            '$repeatBookings.chefDetails.profilePicture',
        },
      },

      // Group back by customer with enriched repeat bookings
      {
        $group: {
          _id: '$_id',
          customerName: { $first: '$customerName' },
          customerProfilePicture: { $first: '$customerProfilePicture' },

          totalBookings: { $first: '$totalBookings' },
          repeatBookings: {
            $push: {
              chefId: '$repeatBookings.chef',
              chefName: '$repeatBookings.chefName',
              profilePicture: '$repeatBookings.chefProfilePicture',
              count: '$repeatBookings.count',
            },
          },
        },
      },

      // Optional: filter out empty chefs (in case of nulls)
      {
        $project: {
          _id: 0,
          customerName: 1,
          customerProfilePicture: 1,
          totalBookings: 1,
          repeatBookings: {
            $filter: {
              input: '$repeatBookings',
              as: 'rb',
              cond: { $ne: ['$$rb.chefId', null] },
            },
          },
        },
      },

      // Sort by highest bookings
      {
        $sort: {
          totalBookings: -1,
        },
      },
    ];

    return this.eventModel.aggregate(pipeline);
  }

  async getMenuInsights() {
    const mostOrderedDishesPipeline: PipelineStage[] = [
      { $unwind: '$menuItems' },
      {
        $lookup: {
          from: 'menus',
          localField: 'menuItems.menuItemId',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem._id',
          itemName: { $first: '$menuItem.title' },
          images: { $first: '$menuItem.images' },
          price: { $first: '$menuItem.price' },
          cuisineStyle: { $first: '$menuItem.cuisine' },
          chefId: { $first: '$menuItem.chef' },
          orders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'chefId',
          foreignField: '_id',
          as: 'chef',
        },
      },
      { $unwind: '$chef' },
      {
        $project: {
          _id: 0,
          itemName: 1,
          images: 1,
          price: 1,
          chefName: {
            $concat: ['$chef.firstName', ' ', '$chef.lastName'],
          },
          cuisineStyle: 1,
          orders: 1,
          avgRating: '$menuItem.avgRating', // optional if stored on menu
        },
      },
      { $sort: { orders: -1 } },
    ];

    const mostPopularCuisinesPipeline: PipelineStage[] = [
      { $unwind: '$menuItems' },
      {
        $lookup: {
          from: 'menus',
          localField: 'menuItems.menuItemId',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem.cuisine',
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          cuisine: '$_id',
          orders: 1,
        },
      },
      { $sort: { orders: -1 } },
    ];

    const [mostOrderedDishes, mostPopularCuisines] = await Promise.all([
      this.eventModel.aggregate(mostOrderedDishesPipeline),
      this.eventModel.aggregate(mostPopularCuisinesPipeline),
    ]);

    return {
      mostOrderedDishes,
      mostPopularCuisines,
    };
  }

  async getTrendingChefsToday() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Step 1: Unwind menuItems and populate full menu
    const pipeline: PipelineStage[] = [
      {
        $match: {
          date: { $gte: todayStart, $lte: todayEnd },
          status: 'completed', // Optional: only completed bookings
        },
      },
      { $unwind: '$menuItems' },
      {
        $lookup: {
          from: 'menus',
          localField: 'menuItems.menuItemId',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: '$menuItem' },
      {
        $group: {
          _id: '$menuItem.chef', // group by chef
          totalBookings: { $sum: 1 },
          cuisines: { $addToSet: '$menuItem.cuisine' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'chef',
        },
      },
      { $unwind: '$chef' },
      {
        $project: {
          _id: 0,
          chefId: '$_id',
          chefName: {
            $concat: ['$chef.firstName', ' ', '$chef.lastName'],
          },
          profilePicture: '$chef.profilePicture',
          totalBookings: 1,
          cuisines: 1,
        },
      },
      { $sort: { totalBookings: -1 } },
    ];

    return this.eventModel.aggregate(pipeline);
  }

  async getMostRepeatedByCustomer(customerId: string) {
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Most repeated dishes
    const mostRepeatedDishesPipeline: PipelineStage[] = [
      { $match: { customer: customerObjectId } },
      { $unwind: '$menuItems' },
      {
        $group: {
          _id: '$menuItems.menuItemId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'menus',
          localField: '_id',
          foreignField: '_id',
          as: 'menu',
        },
      },
      { $unwind: '$menu' },
      {
        $project: {
          _id: 0,
          dishId: '$_id',
          dishTitle: '$menu.title',
          cuisine: '$menu.cuisine',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ];

    // Most repeated chefs
    const mostRepeatedChefsPipeline: PipelineStage[] = [
      { $match: { customer: customerObjectId } },
      {
        $group: {
          _id: '$chef',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'chef',
        },
      },
      { $unwind: '$chef' },
      {
        $project: {
          _id: 0,
          chefId: '$_id',
          chefName: {
            $concat: ['$chef.firstName', ' ', '$chef.lastName'],
          },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ];

    const [mostRepeatedDishes, mostRepeatedChefs] = await Promise.all([
      this.eventModel.aggregate(mostRepeatedDishesPipeline),
      this.eventModel.aggregate(mostRepeatedChefsPipeline),
    ]);

    return {
      mostRepeatedDishes,
      mostRepeatedChefs,
    };
  }

  async getAnalyticsData() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total Menus Created Today
    const totalMenusToday = await this.menuModel.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // 2. Total Customers Created Today
    const totalCustomersToday = await this.userModel.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      role: 'customer',
    });

    // 3. Total Chefs Created Today
    const totalChefsToday = await this.userModel.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      role: 'chef',
    });

    // 4. Total Revenue (All Time)
    const totalRevenueResult = await this.eventModel.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    return {
      totalMenusToday,
      totalCustomersToday,
      totalChefsToday,
      totalRevenue,
    };
  }

  async getSalesStatistics(filter: 'day' | 'week' | 'month' = 'week') {
    const now = new Date();
    let groupFormat: string;

    // Set grouping format based on filter
    switch (filter) {
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U'; // Year and week number
        break;
      case 'month':
      default:
        groupFormat = '%Y-%m'; // Year-Month format
        break;
    }

    // 1. Total Bookings and Revenue grouped by date
    const bookingsAndRevenue = await this.eventModel.aggregate([
      {
        $match: {
          status: 'confirmed', // Only include confirmed events
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. New Customers grouped by date
    const newCustomers = await this.userModel.aggregate([
      {
        $match: {
          role: 'customer',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Booking frequency per customer
    const frequencyPerCustomer = await this.eventModel.aggregate([
      {
        $group: {
          _id: '$customer',
          bookingCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          averageFrequency: { $avg: '$bookingCount' },
        },
      },
    ]);
    const bookingFrequency = frequencyPerCustomer[0]?.averageFrequency || 0;

    // 4. Most ordered cuisines
    const mostOrderedCuisines = await this.eventModel.aggregate([
      { $unwind: '$menuItems' },
      {
        $lookup: {
          from: 'menus',
          localField: 'menuItems.menuItemId',
          foreignField: '_id',
          as: 'menuData',
        },
      },
      { $unwind: '$menuData' },
      {
        $group: {
          _id: '$menuData.cuisine',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      period: filter,
      bookingsAndRevenue, // [{ _id: '2025-06', totalBookings: 14, totalRevenue: 25000 }]
      newCustomers, // [{ _id: '2025-06', count: 5 }]
      bookingFrequency: Math.round(bookingFrequency * 100) / 100,
      mostOrderedCuisines, // [{ _id: 'Pakistani', count: 20 }, ...]
    };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user._id,
      phone: user.phoneNumber,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
