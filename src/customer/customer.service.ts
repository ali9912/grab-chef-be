import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location } from './interfaces/location.interface';
import { LocationDto } from './dto/location.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('Location') private readonly locationModel: Model<Location>,
    private readonly usersService: UsersService,
  ) {}

  async addLocation(userId: string, locationDto: LocationDto) {
    // Verify user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Create and save location
    const location = new this.locationModel({
      userId,
      ...locationDto,
    });

    await location.save();

    return { message: 'Location added successfully' };
  }

  async getLocations(userId: string) {
    return this.locationModel.find({ userId }).exec();
  }

  async getLocationById(locationId: string) {
    const location = await this.locationModel.findById(locationId).exec();
    if (!location) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }
    return location;
  }
}
