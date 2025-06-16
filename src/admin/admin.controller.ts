import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/interfaces/user.interface';
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



}
