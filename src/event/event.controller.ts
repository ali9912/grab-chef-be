import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/interfaces/user.interface';
import { AddIngredientsDto } from './dto/add-ingredients.dto.ts';
import { AttendanceDto } from './dto/attendance.dto';
import { BookingDto } from './dto/booking.dto';
import { CancelBookingDto, ConfirmBookingDto, AcceptBookingDto } from './dto/confirm-booking.dto';
import { EventService } from './event.service';
import { GetEventQueryType } from './interfaces/event.interface';

@ApiTags('Event')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
  @Post(':eventId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async confirmBooking(
    @Param('eventId') eventId: string,
    @Body() confirmBookingDto: ConfirmBookingDto,
    @Req() req: RequestUser,
  ) {
    try {
      // Call the original confirmBooking logic
      const result = await this.eventService.confirmBooking(
        req.user._id.toString(),
        eventId,
        confirmBookingDto,
      );

      // Commenting it ebcasue we are making two calls, we already doing in sendInvoiceToCustomer.
      // If invoice data is present in the confirmBookingDto, send invoice as part of confirmation
      // if ((confirmBookingDto as any).invoiceDto) {
      //   await this.eventService.sendInvoiceToCustomer(
      //     req.user._id.toString(),
      //     eventId,
      //     (confirmBookingDto as any).invoiceDto,
      //   );
      // }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
  @Post(':eventId/chef/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
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

  @ApiBearerAuth('JWT-auth')
  @Post(':eventId/ingredients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async addIngredients(
    @Param('eventId') eventId: string,
    @Body() addIngredientsDto: AddIngredientsDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.addIngredients(
        req.user._id.toString(),
        eventId,
        addIngredientsDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to confirm booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':eventId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async acceptBooking(
    @Param('eventId') eventId: string,
    @Body() acceptBookingDto: AcceptBookingDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.acceptBooking(
        req.user._id.toString(),
        eventId,
        acceptBookingDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to accept booking',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
  @Put('complete/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async completeEvent(
    @Param('eventId') eventId: string,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.completeEvent(
        req.user._id.toString(),
        eventId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to Complete event',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
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

  @ApiBearerAuth('JWT-auth')
  @Delete(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async deleteEvent(
    @Param('eventId') eventId: string,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.eventService.deleteEventById(eventId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete event',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
