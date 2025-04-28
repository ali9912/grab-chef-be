import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
  Request,
  Req,
} from '@nestjs/common';
import { EventService } from './event.service';
import { BookingDto } from './dto/booking.dto';
import { CancelBookingDto, ConfirmBookingDto } from './dto/confirm-booking.dto';
import { AttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { GetEventQueryType } from './interfaces/event.interface';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async createBooking(@Body() bookingDto: BookingDto, @Req() req: RequestUser) {
    try {
      return await this.eventService.createBooking(
        req.user._id.toString(),
        bookingDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':eventId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async confirmBooking(
    @Param('eventId') eventId: string,
    @Body() confirmBookingDto: ConfirmBookingDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.confirmBooking(
        req.user._id.toString(),
        eventId,
        confirmBookingDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post(':eventId/customer/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async customerCancelEvent(
    @Param('eventId') eventId: string,
    @Body() confirmBookingDto: CancelBookingDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.customerCancelEvent(
        req.user._id.toString(),
        eventId,
        confirmBookingDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':eventId/chef/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async chefCancelEvent(
    @Param('eventId') eventId: string,
    @Body() confirmBookingDto: CancelBookingDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.chefCancelEvent(
        req.user._id.toString(),
        eventId,
        confirmBookingDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('detail/:eventId')
  @UseGuards(JwtAuthGuard)
  async getEventById(@Param('eventId') eventId: string) {
    try {
      return await this.eventService.getEventById(eventId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get booking status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('attendance/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async markAttendance(
    @Param('eventId') eventId: string,
    @Body() attendanceDto: AttendanceDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.markAttendance(
        req.user._id.toString(),
        eventId,
        attendanceDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to mark attendance',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getEvents(
    @Query() queryDTO: GetEventQueryType,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.getEvents(
        req.user._id.toString(),
        req.user.role,
        queryDTO,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get events',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
