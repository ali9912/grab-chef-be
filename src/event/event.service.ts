import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Event,
  EventStatus,
  AttendanceStatus,
  Counter,
} from './interfaces/event.interface';
import { BookingDto } from './dto/booking.dto';
import { CancelBookingDto, ConfirmBookingDto } from './dto/confirm-booking.dto';
import { AttendanceDto } from './dto/attendance.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChefService } from '../chef/chef.service';
import { CustomerService } from '../customer/customer.service';
import { User, UserRole } from '../users/interfaces/user.interface';
import { formatDateToYYYYMMDD } from 'src/helpers/date-formatter';
import { Chef } from 'src/chef/interfaces/chef.interface';

@Injectable()
export class EventService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('Counter') private readonly Counter: Model<Counter>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    private readonly chefService: ChefService,
    private readonly customerService: CustomerService,
  ) { }

  async createBooking(customerId: string, bookingDto: BookingDto) {
    // Create event
    const counter = await this.Counter.findOneAndUpdate(
      { name: 'eventOrderId' }, // Counter name
      { $inc: { value: 1 } }, // Increment the counter
      { new: true, upsert: true }, // Create if it doesn't exist
    );

    const event = this.eventModel.create({
      customer: customerId,
      chef: bookingDto.chefId,
      area: bookingDto.area,
      fullAddress: bookingDto.fullAddress,
      menuItems: bookingDto.menuItems,
      date: new Date(bookingDto.date),
      time: bookingDto.time,
      status: EventStatus.PENDING,
      orderId: counter.value, // Assign the incremented value to orderId
    });

    return { message: 'Booking request sent to chef', event };
  }

  async confirmBooking(
    userId: string,
    eventId: string,
    confirmBookingDto: ConfirmBookingDto,
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    // Ensure event belongs to chef
    if (event.chef.toString() !== userId) {
      throw new HttpException(
        'Event does not belong to chef',
        HttpStatus.FORBIDDEN,
      );
    }

    const chef = await this.chefService.getChefByUserId(userId);

    // Update event status
    event.status =
      confirmBookingDto.status === 'confirmed'
        ? EventStatus.CONFIRMED
        : EventStatus.REJECTED;

    if (confirmBookingDto.status === 'rejected' && confirmBookingDto.reason) {
      event.rejectionReason = confirmBookingDto.reason;
    }

    await event.save();

    if (confirmBookingDto.status !== 'rejected') {
      await this.chefService.addEventToCalendar(chef, {
        date: formatDateToYYYYMMDD(event.date),
        timeSlots: [event.time],
      });
    }

    return { message: 'Booking status updated' };
  }

  async customerCancelEvent(
    customerId: string,
    eventId: string,
    cancelBoookingDto: CancelBookingDto,
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    // Ensure event belongs to chef
    if (event.customer.toString() !== customerId) {
      throw new HttpException(
        'Event does not belong to customer',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update event status
    event.status = EventStatus.CANCELLED;
    event.cancelReason = cancelBoookingDto.reason;

    await event.save();

    return { message: 'Booking Cancelled', success: true };
  }

  async chefCancelEvent(
    userId: string,
    eventId: string,
    cancelBoookingDto: CancelBookingDto,
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    // Ensure event belongs to chef
    if (event.chef.toString() !== userId) {
      throw new HttpException(
        'Event does not belong to customer',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update event status
    event.status = EventStatus.CANCELLED;
    event.cancelReason = cancelBoookingDto.reason;

    await event.save();

    return { message: 'Booking Cancelled by chef', success: true };
  }

  async markAttendance(
    chefId: string,
    eventId: string,
    attendanceDto: AttendanceDto,
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    // Ensure event belongs to chef
    if (event.chef.toString() !== chefId) {
      throw new HttpException(
        'Event does not belong to chef',
        HttpStatus.FORBIDDEN,
      );
    }


    // Update attendance status
    event.attendance = {
      status: attendanceDto.status as AttendanceStatus,
      markedAt: attendanceDto.markedAt || new Date().toDateString(),
      location: attendanceDto.location,
    };

    let message = 'Attendance has been marked.';

    if (attendanceDto.status === 'checkout') {
      event.status = EventStatus.COMPLETED;
      message = 'Chef has checout successfully.';
      const chefUser = await this.chefModel.findOne({ userId: chefId })
      if (chefUser) {
        const totalCompletedOrders = chefUser.completedOrders + 1
        chefUser.completedOrders = totalCompletedOrders
      }
      await chefUser.save()
    }

    await event.save();

    return { message };
  }

  async getEvents(userId: string, userRole: UserRole, urlQuery: PaginationDto) {
    const { page = 1, limit = 10, status } = urlQuery;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter events based on user role
    if (userRole === UserRole.CUSTOMER) {
      query = { customer: userId };
    } else if (userRole === UserRole.CHEF) {
      query = { chef: userId };
    }
    if (status) {
      query = { ...query, status };
    }

    const [events, totalCount] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('chef')
        .populate('customer')
        .populate({
          path: 'menuItems.menuItemId', // Populate menuItemId inside menuItems
          model: 'Menu', // Reference the MenuItem model
        })
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 })
        .exec(),
      this.eventModel.countDocuments(query).exec(),
    ]);

    const response = {
      events,
      totalCount,
      page,
      limit,
    };

    return response;
  }

  async getEventById(eventId: string) {
    const event = await this.eventModel
      .findById(eventId)
      .populate('chef')
      .populate('customer')
      .populate({
        path: 'menuItems.menuItemId', // Populate menuItemId inside menuItems
        model: 'Menu', // Reference the MenuItem model
      })
      .exec();

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    return { event, success: true };
  }
}
