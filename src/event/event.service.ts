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
import { PaymentsService } from '../payments/payments.service';
import { ChatService } from '../chat/chat.service';

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
    private readonly paymentsService: PaymentsService,
    private readonly chatService: ChatService,
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
    // Check slot availability
    const chef = await this.chefModel.findOne({ userId: bookingDto.chefId });
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }
    const busyDay = chef.busyDays.find(
      (d) => new Date(d.date).toISOString().split('T')[0] === new Date(bookingDto.date).toISOString().split('T')[0]
    );
    if (!busyDay) {
      throw new HttpException('Selected date is not available for this chef', HttpStatus.BAD_REQUEST);
    }
    const slot = busyDay.timeSlots.find((s) => s.time === bookingDto.time);
    if (!slot) {
      throw new HttpException('Selected time slot is not available for this chef', HttpStatus.BAD_REQUEST);
    }
    // Check if slot is already booked by a confirmed event
    const confirmedEvent = await this.eventModel.findOne({
      chef: bookingDto.chefId,
      date: new Date(bookingDto.date),
      time: bookingDto.time,
      status: EventStatus.CONFIRMED,
    });
    if (slot.isEvent || confirmedEvent) {
      throw new HttpException('Selected time slot is already booked', HttpStatus.BAD_REQUEST);
    }
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
    const customer = await this.userModel.findById(customerId);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Customer';
    if (chefUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: chefUser.fcmTokens,
        userId: chefUser._id.toString(),
        title: 'New Event Request',
        body: `${customerName} has requested an event`,
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
    confirmBookingDto: ConfirmBookingDto & { invoiceDto?: any },
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

    // Only allow confirm if event is ACCEPTED
    if (event.status !== EventStatus.ACCEPTED) {
      throw new HttpException('Event must be accepted before confirmation', HttpStatus.BAD_REQUEST);
    }

    // If date or time is being updated, check slot availability
    if (confirmBookingDto.date || confirmBookingDto.time) {
      const newDate = confirmBookingDto.date ? new Date(confirmBookingDto.date) : event.date;
      const newTime = confirmBookingDto.time ? confirmBookingDto.time : event.time;
      // Check if slot is available in chef's busyDays
      const chefDoc = await this.chefModel.findOne({ userId });
      if (!chefDoc) {
        throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
      }
      const busyDay = chefDoc.busyDays.find(
        (d) => new Date(d.date).toISOString().split('T')[0] === newDate.toISOString().split('T')[0]
      );
      if (!busyDay) {
        throw new HttpException('Selected date is not available for this chef', HttpStatus.BAD_REQUEST);
      }
      const slot = busyDay.timeSlots.find((s) => s.time === newTime);
      if (!slot) {
        throw new HttpException('Selected time slot is not available for this chef', HttpStatus.BAD_REQUEST);
      }
      // Check if slot is already booked by a confirmed event
      const confirmedEvent = await this.eventModel.findOne({
        chef: userId,
        date: newDate,
        time: newTime,
        status: EventStatus.CONFIRMED,
      });
      if (slot.isEvent || confirmedEvent) {
        throw new HttpException('Selected time slot is already booked', HttpStatus.BAD_REQUEST);
      }
      event.date = newDate;
      event.time = newTime;
    }

    const chef = await this.chefService.getChefByUserId(userId);
    const customer = await this.userModel.findById(event.customer);
    
    const chefUser = await this.userModel.findById(userId);
    const chefName = chefUser ? `${chefUser.firstName} ${chefUser.lastName}`.trim() : 'Chef';

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
          body: `${chefName} has rejected your event request`,
          token: '',
          data: {
            type: 'chef-event-rejected',
            data: JSON.stringify(event),
          },
        });
      }
    }

    if (confirmBookingDto.invoiceDto) {
      event.invoice.push({
        advanceAmount: confirmBookingDto.invoiceDto.advanceAmount,
        customerName: confirmBookingDto.invoiceDto.customerName,
        date: new Date(confirmBookingDto.invoiceDto.date),
        time: confirmBookingDto.invoiceDto.time,
        numberOfPeople: confirmBookingDto.invoiceDto.numberOfPeople,
        dishTitle: confirmBookingDto.invoiceDto.dishTitle,
        totalAmount: confirmBookingDto.invoiceDto.totalAmount,
        remainingAmount: confirmBookingDto.invoiceDto.remainingAmount,
      });
      event.totalAmount = confirmBookingDto.invoiceDto.totalAmount;
    }

    await event.save();

    if (confirmBookingDto.status !== 'rejected') {
      // Add event time to chef calendar with isEvent: true
      await this.chefService.addEventToCalendar(chef, {
        date: formatDateToYYYYMMDD(event.date),
        timeSlots: [{ time: event.time, isEvent: true }],
      });

      // Initiate payment for the confirmed event
      const paymentPayload = {
        eventId: event._id.toString(),
        orderNumber: event.orderId.toString(),
        amount: event.totalAmount.toString(),
        customerName: customer?.firstName + ' ' + customer?.lastName,
        customerMobile: customer?.phoneNumber,
        customerEmail: customer?.email,
        customerAddress: event.fullAddress?.name || '',
      };
      await this.paymentsService.create(paymentPayload);

      if (customer) {
        await this.notifcationService.sendNotificationToMultipleTokens({
          tokens: customer.fcmTokens,
          userId: customer._id.toString(),
          title: 'Event request approved',
          body: `Congratulations! ${chefName} has approved your event request.`,
          token: '',
          data: {
            type: 'chef-event-approved',
            data: JSON.stringify(event),
          },
        });
      }

      // If invoiceDto is present, send invoice as part of confirmation
      if ((confirmBookingDto as any).invoiceDto) {
        await this.sendInvoiceToCustomer(
          userId,
          eventId,
          (confirmBookingDto as any).invoiceDto,
        );
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
    const customer = await this.userModel.findById(event.customer);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Customer';
    if (chefUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: chefUser.fcmTokens,
        userId: chefUser._id.toString(),
        title: 'Event has been cancelled',
        body: `${customerName} has cancelled your event`,
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
    const chefUser = await this.userModel.findById(userId);
    const chefName = chefUser ? `${chefUser.firstName} ${chefUser.lastName}`.trim() : 'Chef';
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
        body: `${chefName} has cancelled your event`,
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

    // if (attendanceDto.status === 'checkout') {
    //   event.status = EventStatus.COMPLETED;
    //   message = 'Chef has checkout successfully.';
    //   const chefUser = await this.chefModel.findOne({ userId: chefId });
    //   if (chefUser) {
    //     const totalCompletedOrders = chefUser.completedOrders + 1;
    //     chefUser.completedOrders = totalCompletedOrders;
    //   }
    //   await chefUser.save();
    //   // check for the acheivements by the chef
    //   await this.achievementService.checkForAchievements(chefId);
    // }

    await event.save();

    if (customerUser) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: customerUser?.fcmTokens,
        userId: customerUser._id.toString(),
        title:
          attendanceDto.status === 'attended'
            ? 'Chef is arrived!'
            : 'Event has checkedout',
        body:
          attendanceDto.status === 'attended'
            ? 'Chef has arrived to your location or marked attendance'
            : 'Chef has exited or completed the event',
        token: '',

        data: {
          type:
            attendanceDto.status === 'attended'
              ? 'chef-arrived'
              : 'chef-checkout',
          data: JSON.stringify(event),
        },
      });
    }

    return { message };
  }

  async completeEvent(chefId: string, eventId: string) {
    console.log('===eventId===>', eventId);
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    event.status = EventStatus.COMPLETED;
    const chefUser = await this.chefModel.findOne({ userId: event.chef });
    if (chefUser) {
      const totalCompletedOrders = chefUser.completedOrders + 1;
      chefUser.completedOrders = totalCompletedOrders;
    }
    await chefUser.save();
    // check for the acheivements by the chef
    await this.achievementService.checkForAchievements(chefId);

    await event.save();

    const chef = await this.userModel.findById(chefId);
    const customer = await this.userModel.findById(event.customer);
    const chefName = chef ? `${chef.firstName} ${chef.lastName}`.trim() : 'Chef';
    if (customer) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: customer.fcmTokens,
        userId: customer._id.toString(),
        title: 'Event has been completed',
        body: `${chefName} has completed your event`,
        token: '',
        data: {
          type: 'chef-event-completed',
          data: JSON.stringify(event),
        },
      });
    }

    return { message: 'Event has been completed', success: true, event };
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
    await this.eventModel.findByIdAndDelete(eventId);
    return { success: true, message: 'Event deleted successfully.' };
  }

  async acceptBooking(
    userId: string,
    eventId: string,
    acceptBookingDto: { status: string },
  ) {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    // Ensure event belongs to chef
    if (event.chef.toString() !== userId) {
      throw new HttpException('Event does not belong to chef', HttpStatus.FORBIDDEN);
    }
    if (event.status !== EventStatus.PENDING) {
      throw new HttpException('Only pending events can be accepted', HttpStatus.BAD_REQUEST);
    }
    if (acceptBookingDto.status !== EventStatus.ACCEPTED) {
      throw new HttpException('Invalid status for accept', HttpStatus.BAD_REQUEST);
    }
    event.status = EventStatus.ACCEPTED;
    await event.save();
    
    const chef = await this.userModel.findById(userId);
    const chefName = chef ? `${chef.firstName} ${chef.lastName}`.trim() : 'Chef';
    
    // Notify customer
    const customer = await this.userModel.findById(event.customer);
    if (customer) {
      await this.notifcationService.sendNotificationToMultipleTokens({
        tokens: customer.fcmTokens,
        userId: customer._id.toString(),
        title: 'Event request accepted',
        body: `${chefName} has accepted your event request.`,
        token: '',
        data: {
          type: 'chef-event-accepted',
          data: JSON.stringify(event),
        },
      });
    }
    return { message: 'Booking accepted' };
  }

  async sendInvoiceToCustomer(
    chefId: string,
    eventId: string,
    invoiceDto: any,
  ) {
    // Find event and customer
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
    }
    if (event.chef.toString() !== chefId) {
      throw new HttpException('Event does not belong to chef', HttpStatus.FORBIDDEN);
    }
    const customer = await this.userModel.findById(event.customer);
    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }
    // Create payment for advance amount
    const paymentPayload = {
      eventId: event._id.toString(),
      orderNumber: event.orderId.toString(),
      amount: invoiceDto.advanceAmount.toString(),
      customerName: invoiceDto.customerName,
      customerMobile: customer.phoneNumber,
      customerEmail: customer.email,
      customerAddress: event.fullAddress?.name || '',
      payProOrderId: undefined,
      payProResponse: undefined,
    };
    await this.paymentsService.create(paymentPayload);
    const payment = await this.paymentsService.findByEventId(event._id.toString());
    // Compose chat message with invoice link
    const paymentLink = payment.payProResponse?.paymentLink || 'https://paypro.com.pk/invoice/' + payment.orderNumber;
    const chatMessage = {
      type: 'invoice',
      body: `Please pay your advance for ${invoiceDto.dishTitle}`,
      paymentLink,
      amount: invoiceDto.advanceAmount,
      date: invoiceDto.date,
      time: invoiceDto.time,
      numberOfPeople: invoiceDto.numberOfPeople,
      dishTitle: invoiceDto.dishTitle,
      totalAmount: invoiceDto.totalAmount,
      remainingAmount: invoiceDto.remainingAmount,
    };
    await this.chatService.sendMessage(
      chefId,
      { receiver: customer._id.toString(), body: JSON.stringify(chatMessage), eventId: eventId }
    );
    return {
      message: 'Invoice sent to customer',
      payment,
      chatMessage,
    };
  }
}
