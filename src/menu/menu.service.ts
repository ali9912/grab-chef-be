import {
  HttpCode,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { User } from 'src/users/interfaces/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { Menu } from './schemas/menu.schema';
import { ChefService } from 'src/chef/chef.service';
import { ConfigService } from 'aws-sdk';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel('Menu') private readonly menuModel: Model<Menu>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly chefService: ChefService,
  ) {}

  async create(createMenuDto: CreateMenuDto, userInfo: User) {
    const userId = userInfo._id.toString();
    const chef = await this.chefService.getChefByUserId(userId);
    if (!chef.length) {
      return new HttpException(
        "Chef by this userId doen't exists",
        HttpStatus.NOT_FOUND,
      );
    }

    const menu = await this.menuModel.create(createMenuDto);

    return {
      menu,
      message: 'Menu has been created successfully',
      success: true,
    };
  }

  findAll() {
    return `This action returns all menu`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menu`;
  }

  update(id: number, updateMenuDto: UpdateMenuDto) {
    return `This action updates a #${id} menu`;
  }

  remove(id: number) {
    return `This action removes a #${id} menu`;
  }
}
