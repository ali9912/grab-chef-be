import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChefAuthDto, RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { CreatePasswordDto } from './dto/create-password.dto';
import { JwtAuthChefGuard, JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestUser } from './interfaces/request-user.interface';
import { LoginWithPhoneDto } from './dto/signup-with-phone.dto';
import { EditChefDto } from './dto/edit-chef.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('chef')
  async chefAuth(@Body() chefAuthDto: ChefAuthDto) {
    try {
      return await this.authService.chefAuth(chefAuthDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthChefGuard)
  @Put('chef/profile')
  async editChefProfile(
    @Body() chefAuthDto: EditChefDto,
    @Req() req: RequestUser,
  ) {
    try {
      const user = req?.user;
      return await this.authService.editChefProfile(chefAuthDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login/phone')
  async loginWithPhoneNumber(@Body() loginWithPhoneNumber: LoginWithPhoneDto) {
    try {
      return await this.authService.loginWithPhoneNumber(loginWithPhoneNumber);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login with phone failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      return await this.authService.verifyOtp(verifyOtpDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'OTP verification failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-password')
  async createPassword(
    @Body() createPasswordDto: CreatePasswordDto,
    @Req() req: RequestUser,
  ) {
    try {
      const user = req?.user;
      return await this.authService.createPassword(createPasswordDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Password Creation failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
