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
import { Salary } from 'src/core/types/interfaces/salary.interface';

@Injectable()
export class PointagesService {
  constructor(
    @InjectModel('Pointage') public readonly pointageModel: Model<Pointage>,
    private userService: UsersService,
  ) {}

  async create(createPointageDto: CreatePointageDto): Promise<any | undefined> {
    try {
      // Parse start time and end time if provided
      if (createPointageDto.startTime) {
        const parsedStartTime = parseDateTime(
          createPointageDto.startTime.toString(),
        );
        if (!isNaN(parsedStartTime.getTime())) {
          createPointageDto.startTime = parsedStartTime;
        } else {
          throw new Error('Invalid startTime format');
        }
      }

      // Set endTime if not provided or invalid
      if (!createPointageDto.endTime || isNaN(parseDateTime(createPointageDto.endTime.toString()).getTime())) {
        // Set endTime to startTime + 10 hours
        const startTime = createPointageDto.startTime || new Date(); // If startTime is not provided, use current time
        const endTime = new Date(startTime.getTime() + 10 * 60 * 60 * 1000); // 10 hours later
        createPointageDto.endTime = endTime;
        createPointageDto.existingEndTime = false;
    } else {
        // Parse end time if provided
        const parsedEndTime = parseDateTime(createPointageDto.endTime.toString());
        if (!isNaN(parsedEndTime.getTime())) {
            createPointageDto.endTime = parsedEndTime;
            createPointageDto.existingEndTime = true;
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
      if (employee.status === 'INACTIVE') {
        throw new HttpException(
          'Inactive employee cannot create pointage',
          HttpStatus.UNAUTHORIZED,
        );
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

      return formattedPointage;
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

  async update(
    id: string,
    updatePointageDto: UpdatePointageDto,
  ): Promise<any | undefined> {
    try {
      // Find the pointage record by ID
      const existingPointage = await this.pointageModel.findById(id).exec();
      if (!existingPointage) {
        throw new HttpException(
          'Pointage record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Parse start time and end time if provided in the update DTO
      if (updatePointageDto.startTime) {
        const parsedStartTime = parseDateTime(
          updatePointageDto.startTime.toString(),
        );
        if (!isNaN(parsedStartTime.getTime())) {
          updatePointageDto.startTime = parsedStartTime;
        } else {
          throw new Error('Invalid startTime format');
        }
      }

      if (updatePointageDto.endTime) {
        const parsedEndTime = parseDateTime(
          updatePointageDto.endTime.toString(),
        );
        if (!isNaN(parsedEndTime.getTime())) {
          updatePointageDto.endTime = parsedEndTime;
        } else {
          throw new Error('Invalid endTime format');
        }
      }

      // Check if startTime and endTime overlap with existing records
      if (updatePointageDto.startTime && updatePointageDto.endTime) {
        const overlapPointage = await this.pointageModel
          .findOne({
            _id: { $ne: id }, // Exclude current pointage record
            employee: updatePointageDto.employee,
            $or: [
              {
                startTime: {
                  $lt: updatePointageDto.endTime,
                  $gte: new Date(
                    new Date(updatePointageDto.startTime).setHours(0, 0, 0),
                  ),
                },
              },
              {
                endTime: {
                  $gt: updatePointageDto.startTime,
                  $lte: new Date(
                    new Date(updatePointageDto.endTime).setHours(23, 59, 59),
                  ),
                },
              },
            ],
          })
          .exec();

        if (overlapPointage) {
          throw new HttpException(
            'Overlap with existing pointage record',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Calculate and assign the salary for the pointage
      const employee = await this.userService.findOne(
        existingPointage.employee,
      );
      if (!employee) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }
      if (employee.status === 'INACTIVE') {
        throw new HttpException(
          'Inactive employee cannot update pointage',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const salaire = employee.salary;

      // Update the record with the additional salaire field
      await existingPointage.updateOne({ ...updatePointageDto, salaire });

      // Fetch updated pointage record
      const updatedPointage = await this.pointageModel.findById(id).exec();

      // Format startTime and endTime before returning
      const formattedPointage = {
        ...updatedPointage.toJSON(),
        startTime: formatDateTime(updatedPointage.startTime),
        endTime: formatDateTime(updatedPointage.endTime),
      };

      return formattedPointage;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} pointage`;
  }

  // salary calculation for each user
  async findAllSalaryPayments(options): Promise<any> {
    console.log(
      '🚀 ~ PointagesService ~ findAllSalaryPayments ~ options:',
      options,
    );
    options.filter.deleted = false;

    // Parse and format start date to ISODate
    const startDate = parseDate(options.filter.startDate);
    const endDate = parseDate(options.filter.endDate);

    const aggregationPipeline = [
      {
        $match: {
          deleted: false,
          created_at: { $gte: startDate, $lte: endDate }, // Filter by date range
        },
      },
      {
        $group: {
          _id: '$employee',
          daysWorked: { $sum: 1 }, // Count the number of pointages for each employee
        },
      },
      {
        $lookup: {
          from: 'users', // Collection name where users (employees) are stored
          localField: '_id',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee', // Unwind the array created by $lookup to get single user document
      },
      {
        $project: {
          name: { $concat: ['$employee.firstname', ' ', '$employee.lastname'] },
          salaryType: '$employee.salaryType',
          days: '$daysWorked',
          amount: {
            $cond: {
              if: { $eq: ['$employee.salaryType', 'DAILY'] },
              then: { $multiply: ['$employee.salary', '$daysWorked'] }, // Calculate total salary for DAILY salary type
              else: '$employee.salary', // Return monthly salary without calculation for MONTHLY salary type
            },
          },
        },
      },
    ];

    const salaryPayments = await this.pointageModel
      .aggregate(aggregationPipeline)
      .exec();
    return salaryPayments;
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
