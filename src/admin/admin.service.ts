import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AdminLoginDTO } from './dtos/admin-login-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chef, ChefVerificationStatus } from 'src/chef/interfaces/chef.interface';
import { EventStatus, MenuItem } from 'src/event/interfaces/event.interface';
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
  ) { }

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

    const newUser = await this.userModel.create({ ...adminRegisterDTO, role: UserRole.ADMIN })

    const token = this.generateToken(newUser);

    return {
      token,
      user: newUser,
      message: 'Admin Registered successfully',
    };
  }

  async getDashboardAnalytics() {
    const totalMenu = await this.menuModel.find().countDocuments()
    const totalOrders = await this.eventModel.find().countDocuments()
    const totalCustomer = await this.userModel.find({ role: UserRole.CUSTOMER }).countDocuments()
    const totalChef = await this.userModel.find({ role: UserRole.CHEF }).countDocuments()

    return { totalMenu, totalChef, totalCustomer, totalOrders }
  }

  async getTopRatedChef() {

    const topRatedChef = await this.chefModel.find({ avgRating: { $gt: 0 } })
      .sort({ avgRating: -1, noOfReviews: -1 }) // Sort by rating, then by review count
      // .limit(limit)
      .populate('userId') // Optional: Populate user info
      .lean();

    return { topRatedChef }
  }

  async getAllCustomers() {
    const customers = await this.userModel.find({ role: UserRole.CUSTOMER }).populate('customer')
    return { customers }
  }

  async getAllChefs() {
    const chef = await this.userModel.find({ role: UserRole.CHEF }).populate('chef')
    return { chef }
  }

  async getChefRequests() {
    const chef = await this.chefModel.find({ status: ChefVerificationStatus.PENDING }).populate('userId')
    return { chef }
  }

  async updateChefStatus(userId: string, status: ChefVerificationStatus) {
    const chef = await this.chefModel.findOne({ userId })
    if (!chef) {
      throw new HttpException("Chef not found", HttpStatus.NOT_FOUND)
    }
    await chef.updateOne({ status })
    await chef.save()
    if (status === ChefVerificationStatus.APPROVED) {
      // send notification
    } else if (status === ChefVerificationStatus.REJECTED) {
      // send notification
    }
    return { message: "Chef status updated." }
  }

  async getCustomerById(userId: string) {
    const customer = await this.userModel.findById(userId).populate('customer')
    return { customer }
  }

  async getChefById(userId: string) {
    const chef = await this.userModel.findById(userId).populate('chef')
    return { chef }
  }

  async getAllEvent() {
    const events = await this.eventModel.find().populate([
      { path: 'customer' },
      {
        path: 'chef',
        populate: { path: 'chef' } // 👈 nested population inside chef
      }
    ])
      .lean()
    return { events }
  }

  async getEventById(eventId: string) {
    const event = await this.eventModel.findById(eventId).populate([
      { path: 'customer' },
      {
        path: 'chef',
        populate: { path: 'chef' } // 👈 nested population inside chef
      },
      {
        path: 'menuItems.menuItemId' // 👈 nested path in array
      },
      {
        path: 'ingredients'
      }
    ])
      .lean()
    return { event }
  }

  async getUserUpcomingEvent(userId: string) {
    const user = await this.userModel.findById(userId)
    const query = {
      status: EventStatus.CONFIRMED,
      ...(user.role === UserRole.CUSTOMER && { customer: user._id }),
      ...(user.role === UserRole.CHEF && { chef: user._id })

    }
    const events = await this.eventModel.find(query).populate([
      { path: 'customer' },
      {
        path: 'chef',
        populate: { path: 'chef' } // 👈 nested population inside chef
      },
      {
        path: 'menuItems.menuItemId' // 👈 nested path in array
      },
      {
        path: 'ingredients'
      }
    ])
      .lean()
    return { events }
  }

  async getReviews() {
    const reviews = await this.reviewModel.find().populate(["event", 'chef', 'customer'])
    return { reviews }
  }

  async updateReviewStatus(reviewId: string, status: boolean) {
    const reviews = await this.reviewModel.findByIdAndUpdate({ showInApp: status }).populate(["event", 'chef', 'customer'])
    return { reviews }
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
