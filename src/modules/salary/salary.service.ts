import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Salary } from 'src/core/types/interfaces/salary.interface';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { formatDate, parseDate } from 'src/core/shared/date.utils';
import { UsersService } from '../users/users.service';

@Injectable()
export class SalaryService {
  constructor(
    @InjectModel('Salary') public readonly salaryModel: Model<Salary>,
    private userService: UsersService,
  ) {}
  // function to create Salary
  async create(createSalaryDto: CreateSalaryDto): Promise<any> {
    if (createSalaryDto.date)
      createSalaryDto.date = parseDate(createSalaryDto.date);

    // find and assign the salary & salaryType
    const employee = await this.userService.findOne(createSalaryDto.employee);
    if (!employee) {
      throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
    }
    // set current salary & salaryType
    createSalaryDto.salary = employee.salary;
    createSalaryDto.salaryType = employee.salaryType;

    let createdSalary = new this.salaryModel(createSalaryDto);
    let salary: Salary | undefined;
    try {
      salary = await createdSalary.save();
      if (salary) {
        return {
          _id: salary._id,
          employee: salary.employee,
          status: salary.status,
          date: formatDate(new Date(salary.date)),
          amount: salary.amount,
          salary: salary.salary,
          salaryType: salary.salaryType,
          responsable: salary.responsable,
          message: salary.message,
          created_at: salary.created_at,
          updated_at: salary.updated_at,
        };
      } else {
        throw new HttpException(
          'Error occured, cannot update salary',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('🚀 ~ SalaryService ~ create ~ error:', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All salaries
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    let formattedDate;
    // Parse date strings in DD-MM-YYYY format into Date objects
    if (options.filter?.date) {
      // Extract the year and month from the date in the query string
      const dateString = options.filter.date;
      const [month, year] = dateString.split('-').map(Number);
      // Format the date as MM-YYYY
      formattedDate = `${month.toString().padStart(2, '0')}-${year}`;

      // Calculate the first and last day of the specified month
      const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const lastDayOfMonth = new Date(Date.UTC(year, month, 0));

      // Update the date filter to include the entire month
      options.filter.date = {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      };
    }
    const query = this.salaryModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.salaryModel.countDocuments(options.filter);
    const count = total < limit ? total : limit;
    const lastPage = Math.max(Math.ceil(total / limit), 1);
    const startIndex = (page - 1) * count;
    const endIndex = Math.min(count * page, count);

    const data = await query
      .skip((page - 1) * count)
      .limit(count)
      .exec();
    const formatedData = data.map((doc) => {
      return {
        _id: doc._id,
        employee: doc.employee,
        status: doc.status,
        date: formatDate(new Date(doc.date)),
        amount: doc.amount,
        salary: doc.salary,
        salaryType: doc.salaryType,
        responsable: doc.responsable,
        message: doc.message,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };
    });

    return {
      data: formatedData,
      // totalPrice: data.reduce((acc, curr) => acc + curr?.price, 0),
      count,
      total,
      lastPage,
      startIndex,
      endIndex,
      page,

      pageCount: Math.ceil(total / limit),
    };
  }
  // function to find one salary with id
  async findOne(id: String): Promise<Salary> {
    let options = {} as any;
    options.deleted = false;

    let salary = await this.salaryModel.findById(id, options);
    const doesSalaryExit = this.salaryModel.exists({ _id: id });

    return doesSalaryExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find salary with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return {
          ...salary.toObject(),
          date: formatDate(new Date(salary.date)),
        };
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }
  // function to update one salary
  async update(
    id: string,
    updateSalaryDto: UpdateSalaryDto,
  ): Promise<Salary | undefined> {
    try {
      if (updateSalaryDto.date)
        updateSalaryDto.date = parseDate(updateSalaryDto.date);
      const updatedSalary = await this.salaryModel.findByIdAndUpdate(
        id,
        updateSalaryDto,
        { new: true },
      );

      if (!updatedSalary) {
        throw new HttpException(
          `salary with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        ...updatedSalary.toObject(),
        date: formatDate(new Date(updatedSalary.date)),
      };
    } catch (error) {
      throw new HttpException(
        `Error updating salary: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // soft delete salary record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string): Promise<Salary | undefined> {
    const salary = await this.salaryModel.findById(id);
    if (!salary) {
      throw new HttpException(
        `Could not find salary with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    salary.deleted = true;
    salary.deleted_at = new Date();
    await salary.save();
    return salary;
  }

  // restore salary deleted with soft delete
  async restore(id: string): Promise<Salary | undefined> {
    const salary = await this.salaryModel.findById(id);
    if (!salary) {
      throw new HttpException(
        `Could not find salary with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    salary.deleted = false;
    await salary.save();
    return salary;
  }

  // permanently delete salary
  async permaRemove(id: string): Promise<Salary | undefined> {
    const salary = await this.salaryModel.findById(id);
    if (!salary) {
      throw new HttpException(
        `Could not find salary with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the salary
    await this.salaryModel.deleteOne({ _id: id });
    return salary;
  }
  // function to bulk delete salaries
  async bulkRemove(ids: string[]): Promise<Salary[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const salaries = await this.salaryModel.find({ _id: { $in: objectIds } });
    if (!salaries || salaries.length === 0) {
      throw new HttpException(
        `could not find salaries with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(
      salaries.map(async (salary) => {
        await this.remove(salary._id);
        return salary;
      }),
    );
  }
  getStartAndEndOfWeek(weekNumber: number): {
    startOfWeek: Date;
    endOfWeek: Date;
  } {
    const date = new Date();
    const januaryFirst = new Date(date.getFullYear(), 0, 1);
    const daysToFirstMonday = (8 - januaryFirst.getDay()) % 7;

    const startDate = new Date(
      date.getFullYear(),
      0,
      1 + daysToFirstMonday + (weekNumber - 1) * 7,
    );
    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + 6);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startOfWeek: startDate, endOfWeek: endDate };
  }
}
