import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { AwsS3Service } from '../utils/aws-s3.service';
import { Chef, ChefVerificationStatus } from './interfaces/chef.interface';
import { MenuItem } from './interfaces/menu-item.interface';
import { RegisterChefDto } from './dto/register-chef.dto';
import { MenuItemDto } from './dto/menu-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/interfaces/user.interface';

@Injectable()
export class ChefService {
  constructor(
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('MenuItem') private readonly menuItemModel: Model<MenuItem>,
    private readonly usersService: UsersService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async registerChef(
    registerChefDto: RegisterChefDto,
    files: { idCard: Express.Multer.File[], certifications: Express.Multer.File[] },
  ) {
    if (!files.idCard || !files.certifications) {
      throw new HttpException(
        'ID card and certifications are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find user by ID
    const user = await this.usersService.findById(registerChefDto.userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if user is already a chef
    const existingChef = await this.chefModel.findOne({ userId: user._id }).exec();
    if (existingChef) {
      throw new HttpException('User is already registered as a chef', HttpStatus.BAD_REQUEST);
    }

    // Upload files to S3
    const idCardUrl = await this.awsS3Service.upload(
      files.idCard[0],
      `chef/${user._id}/idCard`,
    );
    const certificationsUrl = await this.awsS3Service.upload(
      files.certifications[0],
      `chef/${user._id}/certifications`,
    );

    // Create chef profile
    const chef = new this.chefModel({
      userId: user._id,
      idCardUrl,
      certificationsUrl,
      cuisine: registerChefDto.cuisine,
      bio: registerChefDto.bio,
      status: ChefVerificationStatus.PENDING,
    });

    await chef.save();

    // Update user role
    await this.usersService.updateRole(user._id.toString(), UserRole.CHEF);

    return { message: 'Chef registered, awaiting admin verification' };
  }

  async getAllChefs(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = { status: ChefVerificationStatus.APPROVED };
    
    const [chefs, totalCount] = await Promise.all([
      this.chefModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName')
        .exec(),
      this.chefModel.countDocuments(query).exec(),
    ]);

    const formattedChefs = chefs.map(chef => ({
      id: chef._id,
      name: `${(chef.userId as any).firstName} ${(chef.userId as any).lastName}`,
      cuisine: chef.cuisine,
      rating: chef.rating,
    }));

    return {
      chefs: formattedChefs,
      totalCount,
      page,
      limit,
    };
  }

  async getChefStatus(chefId: string) {
    const chef = await this.chefModel.findById(chefId).exec();
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    return { status: chef.status };
  }

  async addMenuItem(menuItemDto: MenuItemDto) {
    const chef = await this.chefModel.findOne({ userId: menuItemDto.chefId }).exec();
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    if (chef.status !== ChefVerificationStatus.APPROVED) {
      throw new HttpException('Chef not approved yet', HttpStatus.FORBIDDEN);
    }

    const menuItem = new this.menuItemModel({
      ...menuItemDto,
      chef: chef._id,
    });

    await menuItem.save();

    return { message: 'Menu item added successfully' };
  }

  async updateMenuItem(menuItemId: string, menuItemDto: MenuItemDto) {
    const menuItem = await this.menuItemModel.findById(menuItemId).exec();
    if (!menuItem) {
      throw new HttpException('Menu item not found', HttpStatus.NOT_FOUND);
    }

    const chef = await this.chefModel.findOne({ userId: menuItemDto.chefId }).exec();
    if (!chef) {
      throw new HttpException('Chef not found', HttpStatus.NOT_FOUND);
    }

    // Ensure chef is only updating their own menu items
    if (menuItem.chef.toString() !== (chef._id as any).toString()) {
      throw new HttpException('Not authorized to update this menu item', HttpStatus.FORBIDDEN);
    }

    // Update menu item
    Object.assign(menuItem, {
      title: menuItemDto.title,
      description: menuItemDto.description,
      price: menuItemDto.price,
      images: menuItemDto.images,
      category: menuItemDto.category,
      isSpecial: menuItemDto.isSpecial,
      minOrderQty: menuItemDto.minOrderQty,
    });

    await menuItem.save();

    return { message: 'Menu item updated successfully' };
  }
}
