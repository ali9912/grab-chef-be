import { Injectable } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banners } from './banners.interface';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel('Banners') private readonly bannersModel: Model<Banners>,
  ) {}

  async create(createBannerDto: CreateBannerDto) {
    const banner = await this.bannersModel.create(createBannerDto);
    return { banner, success: true };
  }

  async findAll() {
    const banners = await this.bannersModel.find();
    return { banners };
  }

  async findOne(id: string) {
    return await this.bannersModel.findById(id);
  }

  async update(id: string, updateBannerDto: UpdateBannerDto) {
    return await this.bannersModel.findByIdAndUpdate(id, updateBannerDto, {
      new: true,
    });
  }

  async remove(id: string) {
    await this.bannersModel.findByIdAndDelete(id);
    return { message: 'Banner Deleted' };
  }
}
