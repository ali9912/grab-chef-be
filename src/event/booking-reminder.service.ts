import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Event, EventStatus } from './interfaces/event.interface';
import { User } from 'src/users/interfaces/user.interface';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { MenuItem } from 'src/menu/interfaces/menu.interfaces';

@Injectable()
export class BookingReminderService implements OnModuleInit, OnModuleDestroy {
  private reminderTimer: NodeJS.Timeout;
  private readonly REMINDER_INTERVALS = [
    { hours: 24, label: '24 hours' },    // 1 day before
    { hours: 2, label: '2 hours' },      // 2 hours before
    { hours: 0.5, label: '30 minutes' }  // 30 minutes before
  ];

  constructor(
    @InjectModel('Event') private readonly eventModel: Model<Event>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Menu') private readonly menuModel: Model<MenuItem>,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.startReminderScheduler();
  }

  onModuleDestroy() {
    this.stopReminderScheduler();
  }

  /**
   * Start the reminder scheduler
   */
  private startReminderScheduler() {
    // Check for upcoming bookings every 15 minutes
    this.reminderTimer = setInterval(async () => {
      await this.checkAndSendReminders();
    }, 15 * 60 * 1000); // 15 minutes

    // Also check immediately when service starts
    this.checkAndSendReminders();
    
    console.log('Booking reminder scheduler started');
  }

  /**
   * Stop the reminder scheduler
   */
  private stopReminderScheduler() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      console.log('Booking reminder scheduler stopped');
    }
  }

  /**
   * Check for upcoming bookings and send reminders
   */
  private async checkAndSendReminders() {
    try {
      const now = new Date();
      
      for (const interval of this.REMINDER_INTERVALS) {
        const targetTime = new Date(now.getTime() + interval.hours * 60 * 60 * 1000);
        
        // Find confirmed events that are starting around the target time
        const upcomingEvents = await this.findUpcomingEvents(targetTime, interval.hours);
        
        for (const event of upcomingEvents) {
          await this.sendReminderNotifications(event, interval);
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  }

  /**
   * Find upcoming events within a time window
   */
  private async findUpcomingEvents(targetTime: Date, hoursWindow: number): Promise<Event[]> {
    const startTime = new Date(targetTime.getTime() - (hoursWindow * 60 * 60 * 1000) / 2);
    const endTime = new Date(targetTime.getTime() + (hoursWindow * 60 * 60 * 1000) / 2);

    return await this.eventModel.find({
      status: EventStatus.CONFIRMED,
      date: {
        $gte: startTime,
        $lte: endTime
      }
    }).populate('customer chef').exec();
  }

  /**
   * Send reminder notifications for a specific event
   */
  private async sendReminderNotifications(event: Event, interval: { hours: number; label: string }) {
    try {
      // Get customer and chef user details
      const customerUser = await this.userModel.findById(event.customer);
      const chefUser = await this.userModel.findById(event.chef);
      
      if (!customerUser || !chefUser) {
        console.log(`Skipping reminder for event ${event._id}: User not found`);
        return;
      }

      // Get menu details for the notification
      const menuItems = await this.getMenuItemsDetails(event.menuItems);
      const menuSummary = this.createMenuSummary(menuItems);

      // Send customer reminder
      await this.sendCustomerReminder(customerUser, event, interval, menuSummary);
      
      // Send chef reminder
      await this.sendChefReminder(chefUser, event, interval, menuSummary);

      console.log(`Sent ${interval.label} reminders for event ${event._id}`);
    } catch (error) {
      console.error(`Error sending reminders for event ${event._id}:`, error);
    }
  }

  /**
   * Send reminder notification to customer
   */
  private async sendCustomerReminder(
    customerUser: User, 
    event: Event, 
    interval: { hours: number; label: string },
    menuSummary: string
  ) {
    if (!customerUser.fcmTokens?.length) return;

    const title = this.getCustomerReminderTitle(interval);
    const body = this.getCustomerReminderBody(event, interval, menuSummary);

    await this.notificationsService.sendNotificationToMultipleTokens({
      tokens: customerUser.fcmTokens,
      title,
      body,
      data: {
        type: 'booking_reminder',
        eventId: event._id.toString(),
        orderId: event.orderId.toString(),
        reminderType: interval.label,
        isCustomer: true
      },
      userId: customerUser._id.toString(),
      token: customerUser.fcmTokens[0]
    });
  }

  /**
   * Send reminder notification to chef
   */
  private async sendChefReminder(
    chefUser: User, 
    event: Event, 
    interval: { hours: number; label: string },
    menuSummary: string
  ) {
    if (!chefUser.fcmTokens?.length) return;

    const title = this.getChefReminderTitle(interval);
    const body = this.getChefReminderBody(event, interval, menuSummary);

    await this.notificationsService.sendNotificationToMultipleTokens({
      tokens: chefUser.fcmTokens,
      title,
      body,
      data: {
        type: 'booking_reminder',
        eventId: event._id.toString(),
        orderId: event.orderId.toString(),
        reminderType: interval.label,
        isCustomer: false
      },
      userId: chefUser._id.toString(),
      token: chefUser.fcmTokens[0]
    });
  }

  /**
   * Get customer reminder title based on interval
   */
  private getCustomerReminderTitle(interval: { hours: number; label: string }): string {
    if (interval.hours === 24) return '📅 Your Booking Tomorrow!';
    if (interval.hours === 2) return '⏰ Your Booking in 2 Hours!';
    if (interval.hours === 0.5) return '🚀 Your Booking in 30 Minutes!';
    return '📋 Booking Reminder';
  }

  /**
   * Get chef reminder title based on interval
   */
  private getChefReminderTitle(interval: { hours: number; label: string }): string {
    if (interval.hours === 24) return '👨‍🍳 Tomorrow\'s Booking Reminder';
    if (interval.hours === 2) return '⏰ Upcoming Booking in 2 Hours';
    if (interval.hours === 0.5) return '🚀 Booking Starting in 30 Minutes';
    return '📋 Booking Reminder';
  }

  /**
   * Get customer reminder body
   */
  private getCustomerReminderBody(
    event: Event, 
    interval: { hours: number; label: string },
    menuSummary: string
  ): string {
    const dateStr = event.date.toLocaleDateString();
    const timeStr = event.time;
    const address = event.fullAddress?.name || event.area;

    if (interval.hours === 24) {
      return `Your booking is tomorrow at ${timeStr} in ${address}. Menu: ${menuSummary}`;
    }
    if (interval.hours === 2) {
      return `Your booking starts in 2 hours at ${timeStr} in ${address}. Menu: ${menuSummary}`;
    }
    if (interval.hours === 0.5) {
      return `Your booking starts in 30 minutes at ${timeStr} in ${address}. Menu: ${menuSummary}`;
    }
    return `Reminder: Your booking at ${timeStr} on ${dateStr} in ${address}`;
  }

  /**
   * Get chef reminder body
   */
  private getChefReminderBody(
    event: Event, 
    interval: { hours: number; label: string },
    menuSummary: string
  ): string {
    const dateStr = event.date.toLocaleDateString();
    const timeStr = event.time;
    const address = event.fullAddress?.name || event.area;

    if (interval.hours === 24) {
      return `Tomorrow's booking at ${timeStr} in ${address}. Order #${event.orderId}. Menu: ${menuSummary}`;
    }
    if (interval.hours === 2) {
      return `Upcoming booking in 2 hours at ${timeStr} in ${address}. Order #${event.orderId}. Menu: ${menuSummary}`;
    }
    if (interval.hours === 0.5) {
      return `Booking starting in 30 minutes at ${timeStr} in ${address}. Order #${event.orderId}. Menu: ${menuSummary}`;
    }
    return `Reminder: Booking at ${timeStr} on ${dateStr} in ${address}. Order #${event.orderId}`;
  }

  /**
   * Get menu items details for notification
   */
  private async getMenuItemsDetails(menuItems: any[]): Promise<MenuItem[]> {
    const menuIds = menuItems.map(item => item.menuItemId);
    return await this.menuModel.find({ _id: { $in: menuIds } }).exec();
  }

  /**
   * Create a summary of menu items
   */
  private createMenuSummary(menuItems: MenuItem[]): string {
    if (!menuItems.length) return 'Custom menu';
    
    const itemNames = menuItems.map(item => item.title).slice(0, 3); // Show first 3 items
    if (menuItems.length > 3) {
      return `${itemNames.join(', ')} and ${menuItems.length - 3} more`;
    }
    return itemNames.join(', ');
  }

  /**
   * Manually trigger reminders for testing
   */
  async triggerManualReminders() {
    try {
      console.log('Manually triggering booking reminders...');
      await this.checkAndSendReminders();
      return { success: true, message: 'Manual reminders triggered' };
    } catch (error) {
      console.error('Error triggering manual reminders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get upcoming reminders for a specific user
   */
  async getUserUpcomingReminders(userId: string, isCustomer: boolean = true) {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const query = {
        status: EventStatus.CONFIRMED,
        date: { $gte: now, $lte: tomorrow }
      };

      if (isCustomer) {
        query['customer'] = userId;
      } else {
        query['chef'] = userId;
      }

      const upcomingEvents = await this.eventModel.find(query)
        .sort({ date: 1 })
        .populate('customer chef')
        .exec();

      return {
        success: true,
        reminders: upcomingEvents.map(event => ({
          eventId: event._id,
          orderId: event.orderId,
          date: event.date,
          time: event.time,
          address: event.fullAddress?.name || event.area,
          status: event.status
        }))
      };
    } catch (error) {
      console.error('Error getting user upcoming reminders:', error);
      return { success: false, error: error.message };
    }
  }
}
