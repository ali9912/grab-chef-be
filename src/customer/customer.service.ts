import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LocationDto } from 'src/common/dto/location.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/users/interfaces/user.interface';
import { Customer } from './interface/customer.interface';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Customer') private readonly customerModel: Model<Customer>,
    private readonly usersService: UsersService
  ) { }

  async getMySavedLocations(userId: string) {
    const customer = await this.customerModel.findOne({ userId })
    return { locations: customer.locations }
  }

  async addCustomerLocation(userId: string, locationDto: LocationDto) {
    const customer = await this.customerModel.findOneAndUpdate({ userId }, {
      $addToSet: {
        locations: { $each: [locationDto] }
      }
    }, { new: true })

    if (!customer) {
      console.log("CREATING NEW CUSTOMER AGAINST USER ID")
      const newCustomer = await this.customerModel.create({ userId, locations: [locationDto] })
      console.log("newCustomer", newCustomer)

      return { message: "Customer created and location added", locations: newCustomer.locations }
    }

    return { message: "Location added!", locations: customer.locations }
  }

  async editCustomerLocation(userId: string, locationDto: LocationDto) {
    const { locationId, ...updatedLocation } = locationDto;

    // Find the customer
    const customer = await this.customerModel.findOne({ userId });
    console.log(customer)

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    // Find the location to update
    const locationIndex = customer.locations.findIndex(
      (location: any) => location._id.toString() === locationId
    );

    if (locationIndex === -1) {
      throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
    }

    // Update the specific location
    customer.locations[locationIndex] = { ...customer.locations[locationIndex], ...updatedLocation };

    // Save the updated customer document
    await customer.save();

    return { message: "Location updated!", locations: customer.locations };
  }

  async removeCustomerLocation(userId: string, locationId: string) {
    // Convert locationId to ObjectId if necessary
    const objectId = new mongoose.Types.ObjectId(locationId);

    // Find the customer and remove the specific location
    const customer = await this.customerModel.findOneAndUpdate(
      { userId }, // Match the user
      {
        $pull: {
          locations: { _id: objectId }, // Remove the location with the matching ObjectId
        },
      },
      { new: true } // Return the updated document
    );

    if (!customer) {
      throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    }

    return { message: "Location removed!", locations: customer.locations };
  }

}
