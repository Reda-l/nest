import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePointageDto } from './dto/create-pointage.dto';
import { UpdatePointageDto } from './dto/update-pointage.dto';
import { Pointage } from 'src/core/types/interfaces/pointage.interface';
import { Model, MongooseError } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/modules/users/users.service';
import {
  formatDate,
  formatDateTime,
  parseDate,
  parseDateTime,
} from 'src/core/shared/date.utils';

@Injectable()
export class PointagesService {
  constructor(
    @InjectModel('Pointage') public readonly pointageModel: Model<Pointage>,
    private userService: UsersService,
  ) {}

  async create(
    createPointageDto: CreatePointageDto,
  ): Promise<any | undefined> {
    try {
      // Parse start time and end time if provided
    if (createPointageDto.startTime) {
      const parsedStartTime = parseDateTime(createPointageDto.startTime.toString());
      if (!isNaN(parsedStartTime.getTime())) {
        createPointageDto.startTime = parsedStartTime;
      } else {
        throw new Error('Invalid startTime format');
      }
    }

    if (createPointageDto.endTime) {
      const parsedEndTime = parseDateTime(createPointageDto.endTime.toString());
      if (!isNaN(parsedEndTime.getTime())) {
        createPointageDto.endTime = parsedEndTime;
      } else {
        throw new Error('Invalid endTime format');
      }
    }
      // Check if a pointage record already exists for the same day and employee
      const existingPointage = await this.pointageModel
        .findOne({
          employee: createPointageDto.employee,
          startTime: {
            $gte: new Date(
              new Date(createPointageDto.startTime).setHours(0, 0, 0),
            ),
            $lt: new Date(
              new Date(createPointageDto.startTime).setHours(23, 59, 59),
            ),
          },
        })
        .exec();

      if (existingPointage) {
        throw new HttpException(
          'Pointage record for the same day already exists',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Calculate and assign the salary for the pointage
      const employee = await this.userService.findOne(
        createPointageDto.employee,
      );
      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      const salaire = employee.salary;

      // Save the record with the additional salaire field
      const pointage = await this.pointageModel.create({
        ...createPointageDto,
        salaire,
      });

      // Format startTime and endTime before returning
    const formattedPointage = {
      ...pointage.toJSON(),
      startTime: formatDateTime(pointage.startTime),
      endTime: formatDateTime(pointage.endTime),
    };

    return formattedPointage
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    const query = this.pointageModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ created_at: -1 }); // Default sort by created_at in descending order
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.pointageModel.countDocuments(options.filter);
    const count = total < limit ? total : limit;
    const lastPage = Math.max(Math.ceil(total / limit), 1);
    const startIndex = (page - 1) * count;
    const endIndex = Math.min(count * page, count);

    const data = await query
      .skip((page - 1) * count)
      .limit(count)
      .populate({
        path: 'employee',
        select: '_id firstname lastname email salaryType',
        model: 'User',
      })
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

  async findOne(id: string): Promise<Pointage> {
    try {
      let options = {} as any;
      options.deleted = false;
      const pointage = await this.pointageModel
        .findById(id, options)
        .populate({
          path: 'employee',
          select: '_id firstname lastname email salaryType',
          model: 'User',
        })
        .exec();
      if (!pointage) {
        throw new HttpException(
          `Could not find pointage with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return pointage;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // function to get all pointage of a specific user
  async getPointageByUserId(userId: string, options): Promise<any> {
    options.filter.deleted = false;
    options.filter.employee = userId;
    let formattedDate;
    if (options.filter?.startTime) {
      // Extract the year and month from the date in the query string
      const dateString = options.filter.startTime;
      const [month, year] = dateString.split('-').map(Number);
      // Format the date as MM-YYYY
      formattedDate = `${month.toString().padStart(2, '0')}-${year}`;

      // Calculate the first and last day of the specified month
      const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0));

      // Update the date filter to include the entire month
      options.filter.startTime = {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      };
    }

    const query = this.pointageModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ created_at: -1 }); // Default sort by created_at in descending order
    }
    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    const data = await query
      .populate({
        path: 'employee',
        select: '_id firstname lastname email salaryType salary status role',
        model: 'User',
      })
      .exec();

    const pointages = data.map((pointage) => ({
      _id: pointage._id,
      startTime: formatDateTime(new Date(pointage.startTime)),
      endTime: formatDateTime(new Date(pointage.endTime)),
      salaire: pointage.salaire,
    }));

    const stats = {
      date: formattedDate,
      status: data.length > 0 ? 'PAID' : 'UNPAID', // Assuming if there are any pointages, it's paid
    };

    return {
      employee: data[0]?.employee,
      stats,
      pointages,
    };
  }

  update(id: number, updatePointageDto: UpdatePointageDto) {
    return `This action updates a #${id} pointage`;
  }

  remove(id: number) {
    return `This action removes a #${id} pointage`;
  }

  /**
   * Reads a mongo database error and attempts to provide a better error message. If
   * it is unable to produce a better error message, returns the original error message.
   *
   * @private
   * @param {MongoError} error
   * @param {CreateFlowChartInput} createFlowChartInput
   * @returns {Error}
   * @memberof flowChartService
   */
  private evaluateMongoError(error: MongooseError, dto: any): Error {
    throw new Error(error.message);
  }
}
