import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { MenuService } from 'src/menu/menu.service';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private dailyNotificationTimer: NodeJS.Timeout;
  private weeklyNotificationTimer: NodeJS.Timeout;

  constructor(
    @Inject(forwardRef(() => MenuService))
    private readonly menuService: MenuService,
  ) {}

  onModuleInit() {
    this.startScheduledNotifications();
  }

  onModuleDestroy() {
    this.stopScheduledNotifications();
  }

  /**
   * Start scheduled notifications
   */
  private startScheduledNotifications() {
    // Send daily random dish notifications at 6 PM
    this.scheduleDailyNotifications();
    
    // Send weekly discovery notifications on Sundays at 2 PM
    this.scheduleWeeklyNotifications();
    
    console.log('Notification scheduler started');
  }

  /**
   * Stop all scheduled notifications
   */
  private stopScheduledNotifications() {
    if (this.dailyNotificationTimer) {
      clearTimeout(this.dailyNotificationTimer);
    }
    if (this.weeklyNotificationTimer) {
      clearTimeout(this.weeklyNotificationTimer);
    }
    console.log('Notification scheduler stopped');
  }

  /**
   * Schedule daily notifications at 6 PM
   */
  private scheduleDailyNotifications() {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(18, 0, 0, 0); // 6 PM

    // If it's past 6 PM today, schedule for tomorrow
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const timeUntilTarget = targetTime.getTime() - now.getTime();

    this.dailyNotificationTimer = setTimeout(async () => {
      try {
        console.log('Sending daily random dish notifications...');
        await this.menuService.sendRandomDishNotifications();
        
        // Schedule next day
        this.scheduleDailyNotifications();
      } catch (error) {
        console.error('Error in daily notification scheduler:', error);
        // Retry in 1 hour if failed
        setTimeout(() => this.scheduleDailyNotifications(), 60 * 60 * 1000);
      }
    }, timeUntilTarget);
  }

  /**
   * Schedule weekly notifications on Sundays at 2 PM
   */
  private scheduleWeeklyNotifications() {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(14, 0, 0, 0); // 2 PM

    // Find next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    if (daysUntilSunday === 0 && now > targetTime) {
      // If it's Sunday but past 2 PM, schedule for next Sunday
      targetTime.setDate(targetTime.getDate() + 7);
    } else {
      targetTime.setDate(targetTime.getDate() + daysUntilSunday);
    }

    const timeUntilTarget = targetTime.getTime() - now.getTime();

    this.weeklyNotificationTimer = setTimeout(async () => {
      try {
        console.log('Sending weekly dish discovery notifications...');
        await this.menuService.sendRandomDishNotifications();
        
        // Schedule next week
        this.scheduleWeeklyNotifications();
      } catch (error) {
        console.error('Error in weekly notification scheduler:', error);
        // Retry in 6 hours if failed
        setTimeout(() => this.scheduleWeeklyNotifications(), 6 * 60 * 60 * 1000);
      }
    }, timeUntilTarget);
  }

  /**
   * Manually trigger random notifications (useful for testing)
   */
  async triggerRandomNotifications() {
    try {
      console.log('Manually triggering random dish notifications...');
      const result = await this.menuService.sendRandomDishNotifications();
      return result;
    } catch (error) {
      console.error('Error manually triggering notifications:', error);
      throw error;
    }
  }

  /**
   * Get next scheduled notification times
   */
  getNextScheduledTimes() {
    const now = new Date();
    
    // Calculate next daily notification (6 PM)
    const nextDaily = new Date();
    nextDaily.setHours(18, 0, 0, 0);
    if (now > nextDaily) {
      nextDaily.setDate(nextDaily.getDate() + 1);
    }

    // Calculate next weekly notification (Sunday 2 PM)
    const nextWeekly = new Date();
    nextWeekly.setHours(14, 0, 0, 0);
    const daysUntilSunday = (7 - now.getDay()) % 7;
    if (daysUntilSunday === 0 && now > nextWeekly) {
      nextWeekly.setDate(nextWeekly.getDate() + 7);
    } else {
      nextWeekly.setDate(nextWeekly.getDate() + daysUntilSunday);
    }

    return {
      nextDaily: nextDaily.toISOString(),
      nextWeekly: nextWeekly.toISOString(),
      currentTime: now.toISOString()
    };
  }
}
