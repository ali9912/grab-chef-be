import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AchievementsService } from 'src/achievements/achievements.service';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { formatDateToYYYYMMDD } from 'src/helpers/date-formatter';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ChefService } from '../chef/chef.service';
import { User, UserRole } from '../users/interfaces/user.interface';
import { AddIngredientsDto } from './dto/add-ingredients.dto.ts';
import { AttendanceDto } from './dto/attendance.dto';
import { BookingDto } from './dto/booking.dto';
import { CancelBookingDto, ConfirmBookingDto } from './dto/confirm-booking.dto';
import {
  AttendanceStatus,
  Counter,
  Event,
  EventStatus,
  GetEventQueryType,
  MenuItem as MenuDTO,
} from './interfaces/event.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';

@Injectable()
export class EventService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('Counter') private readonly Counter: Model<Counter>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,

    private readonly chefService: ChefService,
    private readonly achievementService: AchievementsService,
    private readonly notifcationService: NotificationsService,
  ) {}

  calculateTotalPrice = async (menus: any[]) => {
    let total = 0;

    for (const element of menus) {
      let menuPrice = (await this.menuModel.findById(element.menuItemId)).price;
      menuPrice = Number(menuPrice);
      total = total + menuPrice * element.quantity;
    }

    return total;
  };

  async createBooking(customerId: string, bookingDto: BookingDto) {
    // Create event
    const counter = await this.Counter.findOneAndUpdate(
      { name: 'eventOrderId' }, // Counter name
      { $inc: { value: 1 } }, // Increment the counter
      { new: true, upsert: true }, // Create if it doesn't exist
    );

    const event = await this.eventModel.create({
      customer: customerId,
      chef: bookingDto.chefId,
      area: bookingDto.area,
      fullAddress: bookingDto.fullAddress,
      menuItems: bookingDto.menuItems,
      date: new Date(bookingDto.date),
      time: bookingDto.time,
      status: EventStatus.PENDING,
      totalAmount: await this.calculateTotalPrice(bookingDto.menuItems),
      orderId: counter.value, // Assign the incremented value to orderId
    });

    const chefUser = await this.userModel.findById(bookingDto.chefId);
    if (chefUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: chefUser.fcmTokens,
        userId: chefUser._id.toString(),
        title: 'New Event Request',
        body: 'You have a new event request',
        token: '',
        data: {
          type: 'event-request',
          data: JSON.stringify(event),
        },
      });
    }

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
    const customer = await this.userModel.findById(event.customer);

    // Update event status
    event.status =
      confirmBookingDto.status === 'confirmed'
        ? EventStatus.CONFIRMED
        : EventStatus.REJECTED;

    if (confirmBookingDto.status === 'rejected' && confirmBookingDto.reason) {
      event.rejectionReason = confirmBookingDto.reason;

      if (customer) {
        await this.notifcationService.sendNotificationToMultipleTokens({
          tokens: customer.fcmTokens,
          title: 'Event request rejected',
          userId: customer._id.toString(),
          body: 'Chef has rejected your event request',
          token: '',
          data: {
            type: 'chef-event-rejected',
            data: JSON.stringify(event),
          },
        });
      }
    }

    await event.save();

    if (confirmBookingDto.status !== 'rejected') {
      // Add event time to chef calendar with isEvent: true
      await this.chefService.addEventToCalendar(chef, {
        date: formatDateToYYYYMMDD(event.date),
        timeSlots: [{ time: event.time, isEvent: true }],
      });

      if (customer) {
        await this.notifcationService.sendNotificationToMultipleTokens({
          tokens: customer.fcmTokens,
          userId: customer._id.toString(),
          title: 'Event request approved',
          body: 'Congratulations! Chef has approved your event request.',
          token: '',
          data: {
            type: 'chef-event-approved',
            data: JSON.stringify(event),
          },
        });
      }
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

    // Ensure event belongs to customer
    if (event.customer.toString() !== customerId) {
      throw new HttpException(
        'Event does not belong to customer',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update event status and reason
    event.status = EventStatus.CANCELLED;
    event.cancelReason = cancelBoookingDto.reason;

    const eventDateStr = new Date(event.date).toISOString().split('T')[0];

    const chef = await this.chefModel.findOne({
      userId: event.chef.toString(),
    });
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    const updatedBusyDays = chef.busyDays.map((busyDay) => {
      const busyDateStr = new Date(busyDay.date).toISOString().split('T')[0];

      if (busyDateStr !== eventDateStr) return busyDay;

      const updatedTimeSlots = busyDay.timeSlots.filter(
        (slot) => slot.time !== event.time || slot.isEvent === false,
      );

      return updatedTimeSlots.length > 0
        ? { ...busyDay, timeSlots: updatedTimeSlots }
        : null;
    });

    // Remove null (empty date) entries
    chef.busyDays = updatedBusyDays.filter(Boolean);
    await chef.save();

    await event.save();

    const chefUser = await this.userModel.findById(event.chef);
    if (chefUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: chefUser.fcmTokens,
        userId: chefUser._id.toString(),
        title: 'Event has been cancelled',
        body: 'Unfortunately, your event has been cancelled',
        token: '',
        data: {
          type: 'customer-event-cancelled',
          data: JSON.stringify(event),
        },
      });
    }

    return { message: 'Booking Cancelled', success: true };
  }

  async chefCancelEvent(
    userId: string,
    eventId: string,
    cancelBoookingDto: CancelBookingDto,
  ) {
    const event = await this.eventModel
      .findById(eventId)
      .populate('customer')
      .exec();

    if (!event) {
      throw new HttpException(
        'This event doesn’t exist.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (event.status === EventStatus.CANCELLED) {
      throw new HttpException(
        'Event is already cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Ensure event belongs to the chef
    if (event.chef.toString() !== userId) {
      throw new HttpException(
        'Event does not belong to chef',
        HttpStatus.FORBIDDEN,
      );
    }

    const eventDateStr = new Date(event.date).toISOString().split('T')[0];
    const chef = await this.chefModel.findOne({ userId });
    const customerUser = event.customer as unknown as User;

    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    const updatedBusyDays = chef.busyDays.map((busyDay) => {
      const busyDateStr = new Date(busyDay.date).toISOString().split('T')[0];

      if (busyDateStr !== eventDateStr) return busyDay;

      const updatedTimeSlots = busyDay.timeSlots.filter(
        (slot) => slot.time !== event.time || slot.isEvent === false,
      );

      return updatedTimeSlots.length > 0
        ? { ...busyDay, timeSlots: updatedTimeSlots }
        : null;
    });

    chef.busyDays = updatedBusyDays.filter(Boolean);
    await chef.save();

    // Update event status and reason
    event.status = EventStatus.CANCELLED;
    event.cancelReason = cancelBoookingDto.reason;
    await event.save();

    // Notify customer
    if (customerUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: customerUser.fcmTokens,
        userId: customerUser._id.toString(),
        title: 'Event has been cancelled',
        body: 'Unfortunately, your event has been cancelled by the chef.',
        token: '',
        data: {
          type: 'chef-event-cancelled',
          data: JSON.stringify(event),
        },
      });
    }

    return { message: 'Booking cancelled by chef', success: true };
  }

  async addIngredients(
    userId: string,
    eventId: string,
    addIngredientsDto: AddIngredientsDto,
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

    // Merge existing ingredients with new ones while maintaining uniqueness
    const existingIngredients = event.ingredients || [];
    const newIngredients = addIngredientsDto.ingredients;

    const updatedIngredients = [...existingIngredients];

    newIngredients.forEach((newIngredient) => {
      const existingIngredientIndex = updatedIngredients.findIndex(
        (existingIngredient) =>
          existingIngredient.name.toLowerCase() ===
          newIngredient.name.toLowerCase(),
      );

      if (existingIngredientIndex !== -1) {
        // Update the quantity of the existing ingredient
        updatedIngredients[existingIngredientIndex].quantity =
          newIngredient.quantity;
      } else {
        // Add the new ingredient if it doesn't exist
        updatedIngredients.push(newIngredient);
      }
    });

    // Update the event's ingredients
    event.ingredients = updatedIngredients;

    await event.save();

    return { message: 'Ingredients added/updated successfully', success: true };
  }

  async markAttendance(
    chefId: string,
    eventId: string,
    attendanceDto: AttendanceDto,
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    const customerUser = await this.userModel.findById(event.customer);
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
    event.attendance.push({
      status: attendanceDto.status as AttendanceStatus,
      markedAt: attendanceDto.markedAt || new Date().toDateString(),
      location: attendanceDto.location
        ? {
            name: attendanceDto.location.name,
            location: {
              coordinates: attendanceDto.location.location.coordinates,
            },
          }
        : undefined,
    });
    console.log(event.attendance);

    let message = 'Attendance has been marked.';

    if (attendanceDto.status === 'checkout') {
      event.status = EventStatus.COMPLETED;
      message = 'Chef has checout successfully.';
      const chefUser = await this.chefModel.findOne({ userId: chefId });
      if (chefUser) {
        const totalCompletedOrders = chefUser.completedOrders + 1;
        chefUser.completedOrders = totalCompletedOrders;
      }
      await chefUser.save();
      // check for the acheivements by the chef
      await this.achievementService.checkForAchievements(chefId);
    }

    await event.save();

    if (customerUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: customerUser?.fcmTokens,
        userId: customerUser._id.toString(),
        title:
          attendanceDto.status === 'attended'
            ? 'Chef is arrived!'
            : 'Event has been completed',
        body:
          attendanceDto.status === 'attended'
            ? 'Chef has arrived to your location or marked attendance'
            : 'Event has been completed, please leave a review.',
        token: '',

        data: {
          type:
            attendanceDto.status === 'attended'
              ? 'chef-arrived'
              : 'event-completed',
          data: JSON.stringify(event),
        },
      });
    }

    return { message };
  }

  async getEvents(
    userId: string,
    userRole: UserRole,
    urlQuery: GetEventQueryType,
  ) {
    const { page = 1, limit = 1000, status } = urlQuery;
    const skip = (page - 1) * limit;

    // console.log(userRole);
    // console.log(userId);
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
      .exec();

    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }

    return { event, success: true };
  }

  async deleteEventsByChefId(chefId: string) {
    await this.eventModel.deleteMany({ chef: chefId });
    return true;
  }

  async deleteEventsByCustomerId(customerId: string) {
    await this.eventModel.deleteMany({ customer: customerId });
    return true;
  }

  async deleteEventById(eventId: string) {
    await this.eventModel.deleteOne({ _id: eventId });
    return { success: true, message: 'Event deleted successfully.' };
  }
}
