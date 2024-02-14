import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, UserRO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoError } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { User } from 'src/core/types/interfaces/user.interface';
import { createObjectCsvWriter } from 'csv-writer';
import { uploadFirebaseFile } from 'src/core/shared/firebaseUpload';
import { Role } from 'src/core/shared/shared.enum';
import { CreateAuthDto } from '../auth/dto/create-auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') public readonly userModel: Model<User>,
  ) { }

  // function to create User
  async create(createUserDto: CreateUserDto): Promise<User> {
    // //upload image
    if (createUserDto.imageUrl) {
      const imageUrl = await uploadFirebaseFile(createUserDto.imageUrl, 'avatars')
      createUserDto.imageUrl = imageUrl
    }
    let createdUser = new this.userModel(createUserDto);
    let user: User | undefined;
    // generate a salt
    try {
      createdUser.password = await bcrypt.hash(createdUser.password, 10);
      user = await createdUser.save();
      if (user) {
        return user;
      } else {
        throw new HttpException(
          'Error occured, cannot update user',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw this.evaluateMongoError(error, createUserDto);
    }
  }

  //function to get All users
  async findAll(options): Promise<UserRO> {
    options.filter.deleted = false;
    const query = this.userModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.userModel.countDocuments(options.filter);
    const count = total < limit ? total : limit;
    const lastPage = Math.max(Math.ceil(total / limit), 1);
    const startIndex = (page - 1) * count;
    const endIndex = Math.min(count * page, count);

    const data = await query
      .skip((page - 1) * count)
      .limit(count)
      .exec();

    return {
      data,
      count,
      total,
      lastPage,
      startIndex,
      endIndex,
      page,

      pageCount: Math.ceil(total / limit),
    };
  }

  // function to find one user with id
  async findOne(id: String): Promise<User> {
    let options = {} as any;
    options.deleted = false;

    let user = this.userModel.findById(id, options).select(['-password', '-createdBy', '-address']);
    const doesUserExit = this.userModel.exists({ _id: id });

    return doesUserExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find user with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return user;
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }

  // function find user with login data
  async findByLogin(userDTO: CreateAuthDto): Promise<User | undefined | User> {
    const {  password, email } = userDTO;
    let user;

    user = await this.userModel.findOne({ email });
    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    let comparasion = false;
    comparasion = await bcrypt.compare(password, user.password);

    if (comparasion) {
      return this.sanitizeUser(user as any);
    } else {
      throw new HttpException('INVALID_PASSWORD', HttpStatus.UNAUTHORIZED);
    }
  }

  // function to find user by username
  async findByPayload(payload) {
    const { id } = payload;
    const user = await this.userModel.findOne({ _id: id });
    return user;
  }

  // function to Validate user
  async validateUser(id: string): Promise<User | undefined> {
    const user = await this.findOne(id);
    if (user) {
      user.emailVerified = true;
      user.status = 'VALIDATED';
      await user.save();
      return user;
    }
    return undefined;
  }

  // function to update one user
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | undefined> {

    // Retrieve the existing user from the database
    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      // Handle the case where the user with the provided ID does not exist
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (updateUserDto.password) {
      this.resetPassword(updateUserDto.username, updateUserDto.password);
    }
    // //upload image
    if (updateUserDto.imageUrl) {
      const imageUrl = await uploadFirebaseFile(updateUserDto.imageUrl, 'avatars')
      updateUserDto.imageUrl = imageUrl
    }
    // check if email already used
    if (updateUserDto.email) {
      const duplicateUser = await this.findOneByEmail(updateUserDto.email);
      if (duplicateUser) {
        throw new HttpException('Email is already taken.', HttpStatus.CONFLICT);
      }
    }

    const fields: UpdateUserDto = {};
    for (const key in updateUserDto) {
      if (typeof updateUserDto[key] !== 'undefined') {
        fields[key] = updateUserDto[key];
      }
    }

    updateUserDto = fields;

    if (Object.keys(updateUserDto).length > 0) {
      let user: User | null = await this.userModel.findById(id);

      if (user) {
        user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
        return user;
      } else {
        throw new HttpException(`Could not find user with id ${id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      // Throw an error or return a response to indicate no updates were made
      throw new HttpException('No fields to update.', HttpStatus.BAD_REQUEST);
    }
  }

  // soft delete user record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string, authUser?: any): Promise<User | undefined> {
    const user = await this.userModel.findById(id);
    if (authUser && authUser?.role == Role.Admin && user.role == Role.SuperAdmin) {
      throw new HttpException(
        `an admin cannot delete a super admin`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!user) {
      throw new HttpException(
        `Could not find user with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    user.deleted = true;
    user.deleted_at = new Date()
    await user.save();
    return user;
  }

  // restore user deleted with soft delete
  async restore(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException(
        `Could not find user with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    user.deleted = false;
    await user.save();
    return user;
  }

  // permanently delete user
  async permaRemove(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new HttpException(
        `Could not find user with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the user
    await this.userModel.deleteOne({ _id: id });
    return user;
  }

  // helper function to remove password from user object before sending it
  sanitizeUser(user: User) {
    delete user.password;
    return user;
  }

  // function to reset user password
  async resetPassword(
    email: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.findOneByEmail(email);
    if (user) {
      password = await bcrypt.hash(password, 10);
      user.password = password;
      await user.save();
      return user;
    }
    return undefined;
  }

  // Returns a user by their unique username or undefined
  async findOneByUsername(username: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ username: username }).exec();
    if (user) return user;
    return undefined;
  }

  // Returns a user by their unique email address or undefined
  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel
      .findOne({ email: email })
      .exec();
    if (user) return user;
    return undefined;
  }

  // function to bulk delete users
  async bulkRemove(ids: string[]): Promise<User[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const users = await this.userModel.find({ _id: { $in: objectIds } });
    if (!users || users.length === 0) {
      throw new HttpException(
        `could not find users with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(users.map(async (user) => {
      await this.remove(user._id)
      return user;
    }));
  }

  // function to bulk validate users
  async validateUsers(ids: string[]): Promise<User[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const users = await this.userModel.find({ _id: { $in: objectIds } });
    if (!users || users.length === 0) {
      throw new HttpException(
        `could not find users with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(users.map(async (user) => {
      user.emailVerified = true;
      user.status = 'VALIDATED';
      await user.save();
      return user;
    }));
  }

  // function that bulk reject given users
  async bulkReject(ids: string[]): Promise<User[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id));
    const users = await this.userModel.updateMany(
      { _id: { $in: objectIds } },
      { status: 'REJECTED' }
    );
    if (!users) {
      throw new HttpException(
        `Could not update users with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.userModel.find({ _id: { $in: objectIds } });
  }

  // function to export all users in the DB
  async usersDataToCSV(): Promise<string> {
    const users = await this.userModel.find()
    const csvWriter = createObjectCsvWriter({
      path: 'csv-files/users.csv',
      header: [
        { id: '_id', title: 'ID' },
        { id: 'username', title: 'Username' },
        { id: 'firstname', title: 'Firstname' },
        { id: 'lastname', title: 'Lastname' },
        { id: 'email', title: 'Email' },
        { id: 'status', title: 'Status' },
        { id: 'lastLoginAt', title: 'Last Login At' },
        { id: 'created_at', title: 'Created At' },
        { id: 'updated_at', title: 'Updated At' },
      ],
    });
    await csvWriter.writeRecords(users);
    return 'csv-files/users.csv';
  }

  // helper function to restore all deleted users
  async restoreAllDeletedUsers(): Promise<any> {
    const result = await this.userModel.updateMany({ deleted: true }, { $set: { deleted: false } });
    return true
  }



  /**
   * Reads a mongo database error and attempts to provide a better error message. If
   * it is unable to produce a better error message, returns the original error message.
   *
   * @private
   * @param {MongoError} error
   * @param {CreateUserInput} createUserInput
   * @returns {Error}
   * @memberof UsersService
   */
  private evaluateMongoError(
    error: MongoError,
    createUserDTO: CreateUserDto,
  ): Error {
    if (error.code === 11000) {
      if (
        error.message.toLowerCase().includes(createUserDTO.email.toLowerCase())
      ) {
        throw new Error(`e-mail ${createUserDTO.email} is already registered`);
      } else if (error.message.toLowerCase().includes(createUserDTO.username)) {
        throw new Error(
          `Username ${createUserDTO.username} is already registered`,
        );
      }
    }
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  }
}
