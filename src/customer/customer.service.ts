import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocationDto } from './dto/location.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class CustomerService {
  constructor(private readonly usersService: UsersService) {}
}
