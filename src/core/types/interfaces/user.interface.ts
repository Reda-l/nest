import { Exclude } from 'class-transformer';
import { Document, Types } from 'mongoose';

export class User extends Document {
  id?: string;
  email?: string;
  status?: string;
  gender?: string;
  firstname?: string;
  lastname?: string;
  middlename?: string;
  DOB?: Date;
  @Exclude()
  password?: string;
  role?: string;
  phoneNumber?: string;
  imageUrl?: string;
  emailVerified?: boolean;
  deleted?: boolean;
  deleted_at?: Date;
}
