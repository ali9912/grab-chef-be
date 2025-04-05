import { Request } from 'express';
import { User } from 'src/users/interfaces/user.interface';

export interface RequestUser extends Request {
  user: User;
}
