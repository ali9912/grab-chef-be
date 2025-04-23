import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/users/interfaces/user.interface';
import { CreateAchievementDto } from './Dto/create-achievement.dto';
import {
  AchievementEnum,
  Achievements,
} from './interfaces/achievement.interface';
import { Chef } from 'src/chef/interfaces/chef.interface';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    @InjectModel('Achievements')
    private readonly achievementsModel: Model<Achievements>,
  ) {}

  async create(createAchievementDto: CreateAchievementDto) {
    const achievement = await this.achievementsModel.create(
      createAchievementDto,
    );
    console.log(achievement);
    await achievement.save();
    return {
      achievement,
      message: 'Achievement goal has been created.',
    };
  }

  async getMyAchievements(userId: string) {
    const user = await this.userModel.findById(userId).populate('chef');
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return { myAchievements: user.chef.achievements };
  }

  async getChefAchivementGoals(userId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, role: UserRole.CHEF })
      .populate('chef');
      
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return { achievements: user.chef.achievements };
  }

  async getAchivementGoals(userId: string) {
    const goals = await this.achievementsModel.find();
    return { goals };
  }

  async checkForAchievements(userId: string) {
    const chef = await this.chefModel.findOne({ userId });
    console.log('CHECKING ACHEIVEMENT FOR =======>', userId);
    if (!chef) {
      throw new HttpException(
        'No chef found for achievements',
        HttpStatus.NOT_FOUND,
      );
    }
    const userAchievements = chef.achievements || [];
    const achievements = await this.achievementsModel.find();
    const userAchievementIds = new Set(userAchievements.map((j) => j._id));
    const filteredAchievements = achievements.filter((i) =>
      userAchievementIds.has(i._id),
    );
    console.log('filteredAchievements', filteredAchievements);
    let matchedItems = [];

    // for (let i = 0; i < filteredAchievements.length; i++) {
    for (let i = 0; i < achievements.length; i++) {
      // const acheivement = filteredAchievements[i]
      const acheivement = achievements[i];
      let isMatched = false;
      acheivement.conditions.forEach((element) => {
        if (element.type === AchievementEnum.ORDERS) {
          isMatched = element.qty === chef.completedOrders;
          console.log('MATCHING THE ORDERS', isMatched, chef.completedOrders);
        }
        if (element.type === AchievementEnum.FIVE_STARS) {
          isMatched = element.qty === chef.noOfFiveStars;
          console.log(
            'MATCHING THE FIVE STARS',
            isMatched,
            chef?.noOfFiveStars,
          );
        }
        if (element.type === AchievementEnum.FOUR_STARS) {
          isMatched = element.qty === chef.noOfFourStars;
          console.log(
            'MATCHING THE FOUR STARS',
            isMatched,
            chef?.noOfFourStars,
          );
        }
      });

      // if isMatched is true, it means
      if (isMatched) {
        console.log('!!!!!!!!!MATCHED!!!!!!!!!', acheivement.label);
        matchedItems.push(acheivement);
      }
    }
    console.log('=======Matched Items=========', matchedItems);
    if (matchedItems.length) {
      // Step 1: Ensure the 'achievements' field is initialized if it doesn't exist
      if (!chef.achievements || chef.achievements.length === 0) {
        await chef.updateOne({
          $set: { achievements: [] }, // Initialize achievements as an empty array if not present
        });
      }

      // Step 2: Add unique items to the 'achievements' array
      await chef.updateOne({
        $addToSet: {
          achievements: { $each: matchedItems }, // Add unique items to the achievements array
        },
      });

      await chef.save();
    }
    return { message: 'checked' };
  }
}
