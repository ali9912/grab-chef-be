import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './interfaces/message.interface';
import { SendMessageDto, AttachFileDto } from './dto/message.dto';
import * as mongoose from 'mongoose';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {}

  async sendMessage(senderId: string, sendMessageDto: SendMessageDto) {
    const { receiver, body } = sendMessageDto;
    const message = new this.messageModel({
      sender: senderId,
      receiver,
      body,
    });
    return await message.save();
  }

  async getChatHistory(userId: string, otherUserId: string) {
    return this.messageModel.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
  }

  async listMyChats(userId: string) {
    const messages = await this.messageModel.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          sender: 1,
          receiver: 1,
          body: 1,
          createdAt: 1,
          read: 1,
          chatPartner: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender"
            ]
          }
        }
      },
      {
        $group: {
          _id: "$chatPartner",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          user: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            profilePicture: 1,
            role: 1
          },
          lastMessage: 1
        }
      }
    ]);
    return messages;
  }

  async attachFile(senderId: string, attachFileDto: AttachFileDto) {
    const { receiver, fileUrl } = attachFileDto;
    let fileName, fileType;
    if (fileUrl) {
      fileName = fileUrl.split('/').pop();
      fileType = fileName?.split('.').pop();
    }
    const message = new this.messageModel({
      sender: senderId,
      receiver,
      fileUrl,
      fileName,
      fileType,
    });
    return await message.save();
  }
} 