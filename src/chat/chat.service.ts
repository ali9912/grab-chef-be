import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './interfaces/message.interface';
import { SendMessageDto, AttachFileDto } from './dto/message.dto';
import * as mongoose from 'mongoose';
import { ChatGateway } from './chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async sendMessage(senderId: string, sendMessageDto: SendMessageDto) {
    const { receiver, body, eventId } = sendMessageDto;
    const message = new this.messageModel({
      sender: senderId,
      receiver,
      body,
      eventId,
    });
    const savedMessage = await message.save();

    // Emit real-time updates
    this.chatGateway.server.to(senderId).emit('chatHistoryUpdate', savedMessage);
    this.chatGateway.server.to(receiver).emit('chatHistoryUpdate', savedMessage);
    this.chatGateway.server.to(senderId).emit('myChatsUpdate');
    this.chatGateway.server.to(receiver).emit('myChatsUpdate');

    // push notification
    try {
      const sender = await this.usersService.findById(senderId);
      const receiverUser = await this.usersService.findById(receiver);
      
      if (sender && receiverUser && receiverUser.fcmTokens && receiverUser.fcmTokens.length > 0) {
        const senderName = sender.firstName && sender.lastName 
          ? `${sender.firstName} ${sender.lastName}`.trim() 
          : 'Someone';
        
        let messageText = body;
        try {
          const parsedBody = JSON.parse(body);
          if (parsedBody.type === 'invoice') {
            messageText = 'Sent you an invoice';
          } else if (parsedBody.body) {
            messageText = parsedBody.body;
          }
        } catch (e) {
          messageText = body;
        }

        await this.notificationsService.sendNotificationToMultipleTokens({
          tokens: receiverUser.fcmTokens,
          userId: receiverUser._id.toString(),
          title: `${senderName} texted you`,
          body: messageText,
          token: '',
          data: {
            type: 'chat-message',
            eventId: eventId || '',
            senderId: senderId,
            data: JSON.stringify(savedMessage),
          },
        });
      }
    } catch (error) {
      console.error('Error sending chat notification:', error);
    }

    return savedMessage;
  }

  async getChatHistory(userId: string, otherUserId: string, eventId: string) {
    return this.messageModel.find({
      eventId,
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });
  }

  async listMyChats(userId: string) {
    // Group by eventId and chat partner
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
          eventId: 1,
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
          _id: { eventId: "$eventId", chatPartner: "$chatPartner" },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.chatPartner",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // Get event details
      {
        $lookup: {
          from: "events",
          localField: "_id.eventId",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },

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
          eventId: "$_id.eventId",
          lastMessage: 1,
          event: "$event"
        }
      }
    ]);
    return messages;
  }

  async attachFile(senderId: string, attachFileDto: AttachFileDto) {
    const { receiver, fileUrl, eventId } = attachFileDto;
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
      eventId,
    });
    const savedMessage = await message.save();

    // Emit real-time updates
    this.chatGateway.server.to(senderId).emit('chatHistoryUpdate', savedMessage);
    this.chatGateway.server.to(receiver).emit('chatHistoryUpdate', savedMessage);
    this.chatGateway.server.to(senderId).emit('myChatsUpdate');
    this.chatGateway.server.to(receiver).emit('myChatsUpdate');

    // push notification
    try {
      const sender = await this.usersService.findById(senderId);
      const receiverUser = await this.usersService.findById(receiver);
      
      if (sender && receiverUser && receiverUser.fcmTokens && receiverUser.fcmTokens.length > 0) {
        const senderName = sender.firstName && sender.lastName 
          ? `${sender.firstName} ${sender.lastName}`.trim() 
          : 'Someone';
        
        const fileTypeText = fileType ? `a ${fileType.toUpperCase()} file` : 'a file';

        await this.notificationsService.sendNotificationToMultipleTokens({
          tokens: receiverUser.fcmTokens,
          userId: receiverUser._id.toString(),
          title: `${senderName} texted you`,
          body: `Sent you ${fileTypeText}`,
          token: '',
          data: {
            type: 'chat-file',
            eventId: eventId || '',
            senderId: senderId,
            data: JSON.stringify(savedMessage),
          },
        });
      }
    } catch (error) {
      console.error('Error sending file notification:', error);
    }

    return savedMessage;
  }
} 