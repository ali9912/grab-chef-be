import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ChefVerificationStatus } from 'src/chef/interfaces/chef.interface';
import { AdminService } from './admin.service';
import { AdminLoginDTO } from './dtos/admin-login-dto';
import { AdminRegisterDTO } from './dtos/admin-register-dto';

@Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async loginAdmin(@Body() loginAdminDto: AdminLoginDTO) {
    try {
      return await this.adminService.loginAdmin(loginAdminDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login Failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  async registerAdmin(@Body() registerAdminDto: AdminRegisterDTO) {
    try {
      return await this.adminService.registerAdmin(registerAdminDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Register admin failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard-analytics')
  async getDashboardAnalytics() {
    try {
      return await this.adminService.getDashboardAnalytics();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting dashboard analytics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('top-chefs')
  async getTopRatedChef() {
    try {
      return await this.adminService.getTopRatedChef();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting top chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-customers')
  async getAllCustomers() {
    try {
      return await this.adminService.getAllCustomers();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting customers',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-chefs')
  async getAllChefs() {
    try {
      return await this.adminService.getAllChefs();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-chefs-requests')
  async getChefRequests() {
    try {
      return await this.adminService.getChefRequests();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting chefs requests',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-chefs-requests/:id')
  async updateChefStatus(
    @Param('id') id: string,
    @Body() chefStatusBody: { status: ChefVerificationStatus },
  ) {
    try {
      return await this.adminService.updateChefStatus(
        id,
        chefStatusBody.status,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting chefs requests',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-chef/:id')
  async getChefById(@Param('id') id: string) {
    try {
      return await this.adminService.getChefById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting chef by id',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-customer/:id')
  async getCustomerById(@Param('id') id: string) {
    try {
      return await this.adminService.getCustomerById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting customer by id',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-events')
  async getAllEvent() {
    try {
      return await this.adminService.getAllEvent();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting events',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-event/:id')
  async getEventById(@Param('id') id: string) {
    try {
      return await this.adminService.getEventById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting customer by id',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-user-event/:userId')
  async getUserUpcomingEvent(@Param('userId') userId: string) {
    try {
      return await this.adminService.getUserUpcomingEvent(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting getUserUpcomingEvent',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-reviews')
  async getReviews() {
    try {
      return await this.adminService.getReviews();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting reviews',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-review-status/:reviewId')
  async updateReviewStatus(
    @Param('reviewId') reviewId: string,
    @Body() reviewBody: { status: boolean },
  ) {
    try {
      return await this.adminService.updateReviewStatus(
        reviewId,
        reviewBody.status,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting reviews',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-revenue-stats')
  async getRevenueStats() {
    try {
      return await this.adminService.getRevenueStats();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting revenue',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('get-event-chef-location')
  async getEventChefLocation() {
    try {
      return await this.adminService.getRevenueStats();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error getting revenue',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('repeating-customers')
  async getRepeatingCustomers() {
    return this.adminService.getRepeatingCustomers();
  }

  @Get('get-menu-insights')
  async getMenuInsights() {
    return this.adminService.getMenuInsights();
  }

  @Get('get-trending-chefs')
  async getTrendingChefsToday() {
    return this.adminService.getTrendingChefsToday();
  }

  @Get('repeated-dishes-chef-by-customer/:customerId')
  async getMostRepeatedByCustomer(@Param('customerId') customerId: string) {
    return this.adminService.getMostRepeatedByCustomer(customerId);
  }
}
