import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action } from 'src/core/types/interfaces/action.interface';

@Injectable()
export class ActionsService {
  constructor(
    @InjectModel('Action') public readonly actionModel: Model<Action>,
  ) { }
  // function to create Action
  async create(createActionDto: CreateActionDto): Promise<Action> {
    let createdDiscount = new this.actionModel(createActionDto);
    let action: Action | undefined;
    try {
      action = await createdDiscount.save();
      if (action) {
        return action;
      } else {
        throw new HttpException(
          'Error occured, cannot update action',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All actions
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    const query = this.actionModel.find(options.filter).populate({
      path: 'user',
      select: 'firstname lastname role email'
  });

    if (options.sort) {
      query.sort(options.sort);
    }else {
      query.sort({ created_at: -1 }); // Default sort by created_at in descending order
  }


    if (options.select && options.select !== '') {
      query.select(options.select);
    }
    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.actionModel.countDocuments(options.filter);
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

  // function to find one action with id
  async findOne(id: String): Promise<Action> {
    let options = {} as any;
    options.deleted = false;

    let action = this.actionModel.findById(id, options);
    const doesActionExit = this.actionModel.exists({ _id: id,options });

    return doesActionExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find action with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return action;
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }
  // function to update one action
  async update(
    id: string,
    updateActionDto: UpdateActionDto,
  ): Promise<Action | undefined> {

    // Retrieve the existing action from the database
    const existingAction = await this.actionModel.findById(id).exec();

    if (!existingAction) {
      // Handle the case where the action with the provided ID does not exist
      throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
    }
    const fields: UpdateActionDto = {};
    for (const key in updateActionDto) {
      if (typeof updateActionDto[key] !== 'undefined') {
        fields[key] = updateActionDto[key];
      }
    }

    updateActionDto = fields;

    if (Object.keys(updateActionDto).length > 0) {
      let action: Action | null = await this.actionModel.findById(id);

      if (action) {
        action = await this.actionModel.findByIdAndUpdate(id, updateActionDto, { new: true }).exec();
        return action;
      } else {
        throw new HttpException(`Could not find action with id ${id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      // Throw an error or return a response to indicate no updates were made
      throw new HttpException('No fields to update.', HttpStatus.BAD_REQUEST);
    }
  }

  // soft delete action record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string): Promise<Action | undefined> {
    const action = await this.actionModel.findById(id);
    if (!action) {
      throw new HttpException(
        `Could not find action with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    action.deleted = true;
    action.deleted_at = new Date()
    await action.save();
    return action;
  }

  // restore action deleted with soft delete
  async restore(id: string): Promise<Action | undefined> {
    const action = await this.actionModel.findById(id);
    if (!action) {
      throw new HttpException(
        `Could not find action with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    action.deleted = false;
    await action.save();
    return action;
  }

  // permanently delete action
  async permaRemove(id: string): Promise<Action | undefined> {
    const action = await this.actionModel.findById(id);
    if (!action) {
      throw new HttpException(
        `Could not find action with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the action
    await this.actionModel.deleteOne({ _id: id });
    return action;
  }
  // function to bulk delete actions
  async bulkRemove(ids: string[]): Promise<Action[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const actions = await this.actionModel.find({ _id: { $in: objectIds } });
    if (!actions || actions.length === 0) {
      throw new HttpException(
        `could not find actions with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(actions.map(async (action) => {
      await this.remove(action._id)
      return action;
    }));
  }
}
