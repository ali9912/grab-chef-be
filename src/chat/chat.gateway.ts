import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Optionally, join a room with userId if sent in handshake
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup if needed
  }
} 