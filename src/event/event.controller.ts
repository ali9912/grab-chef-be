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
} from '@nestjs/common';
import { EventService } from './event.service';
import { BookingDto } from './dto/booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { AttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('booking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async createBooking(@Body() bookingDto: BookingDto, @Request() req) {
    try {
      return await this.eventService.createBooking(req.user.userId, bookingDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('booking/:eventId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async confirmBooking(
    @Param('eventId') eventId: string,
    @Body() confirmBookingDto: ConfirmBookingDto,
    @Request() req,
  ) {
    try {
      return await this.eventService.confirmBooking(req.user.userId, eventId, confirmBookingDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('booking/:eventId/status')
  @UseGuards(JwtAuthGuard)
  async getBookingStatus(@Param('eventId') eventId: string) {
    try {
      return await this.eventService.getBookingStatus(eventId);
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
    @Request() req,
  ) {
    try {
      return await this.eventService.markAttendance(req.user.userId, eventId, attendanceDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to mark attendance',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getEvents(@Query() paginationDto: PaginationDto, @Request() req) {
    try {
      return await this.eventService.getEvents(req.user.userId, req.user.role, paginationDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get events',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
