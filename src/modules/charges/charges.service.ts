import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Charge } from 'src/core/types/interfaces/charge.interface';
import { Appointment } from 'src/core/types/interfaces/appointment.interface';

@Injectable()
export class ChargesService {
  constructor(
    @InjectModel('Charge') public readonly chargeModel: Model<Charge>,
    @InjectModel('Appointment') public readonly appointmentModel: Model<Appointment>,
  ) { }
  // function to create Charge
  async create(createChargeDto: CreateChargeDto): Promise<Charge> {
    let createdUser = new this.chargeModel(createChargeDto);
    let charge: Charge | undefined;
    try {
      charge = await createdUser.save();
      if (charge) {
        return charge;
      } else {
        throw new HttpException(
          'Error occured, cannot update charge',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All charges
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    if (options.filter?.week) {
      const { startOfWeek, endOfWeek } = this.getStartAndEndOfWeek(options.filter?.week);
      options.filter.date = {
        "$gte": startOfWeek,
        "$lt": endOfWeek
      }
      delete options.filter?.week
    }
    if (options.filter?.today) {
      const startOfDay = new Date();
      const endOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
      options.filter.date = {
        "$gte": startOfDay,
        "$lt": endOfDay
      }
      delete options.filter?.today
    }
    if (options.filter?.year) {
      const currentYear = options.filter?.year || new Date().getFullYear();
      const firstDay = new Date(currentYear, 0, 1);
      const lastDay = new Date(currentYear, 11, 31);
      options.filter.date = {
        "$gte": firstDay,
        "$lt": lastDay
      }
      delete options.filter?.year
    }
    if (options.filter?.month) {
      var date = new Date();
      const month = options.filter?.month || date.getMonth()
      var firstDay = new Date(date.getFullYear(), month, 1);
      var lastDay = new Date(date.getFullYear(), month + 1, 0);
      options.filter.date = {
        "$gte": firstDay,
        "$lt": lastDay
      }
      delete options.filter?.month
    }
    const query = this.chargeModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    // Populate the 'responsable' field with specific fields
    query.populate({
      path: 'responsable',
      select: '_id firstname lastname',
    });

    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.chargeModel.countDocuments(options.filter);
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
  //function to get stats
  async getStats(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException("filter dates are missing", HttpStatus.BAD_REQUEST);
      }
      options.filter.startDate = new Date(options.filter.startDate)
      options.filter.endDate = new Date(options.filter.endDate)
      let currentDate = new Date(options.filter.startDate);
      const totalsPerDay: any = []
      let _totalRevenue = 0
      let _totalCharges = 0
      let _totalProfit = 0
      // Loop until the current date is greater than the end date
      while (currentDate <= options.filter.endDate) {
        const totalChargesPerDay = await this.chargeModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: "$price" },
            },
          },
          {
            $project: {
              _id: 0, // Exclude _id from the result
              totalPrice: 1,
            },
          },
        ])
        const totalRevenuePerDay = await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate
            },
          },
          {
            $unwind: "$reservations",
          },
          {
            $unwind: "$reservations.services",
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: "$reservations.services.price" },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
            },
          },
        ]);
        const _totalRevenuePerDay = totalRevenuePerDay.length > 0 ? totalRevenuePerDay[0].totalPrice : 0
        const _totalChargesPerDay = totalChargesPerDay.length > 0 ? totalChargesPerDay[0].totalPrice : 0
        const _totalProfitPerDay = (_totalRevenuePerDay - _totalChargesPerDay) < 0 ? 0 : (_totalRevenuePerDay - _totalChargesPerDay)
        _totalRevenue += _totalRevenuePerDay
        _totalCharges += _totalChargesPerDay
        _totalProfit += _totalProfitPerDay
        totalsPerDay.push({
          totalRevenue: _totalRevenuePerDay,
          date: currentDate.toISOString().split('T')[0],
          totalCharges: _totalChargesPerDay,
          totalProfit: _totalProfitPerDay
        })
        // Increment the current date by one day
        currentDate.setDate(currentDate.getDate() + 1);
      }


      return {
        totalsPerDay,
        totalRevenue: _totalRevenue,
        totalCharges: _totalCharges,
        totalProfit: _totalProfit,
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);

    }
  }
  async getTopPerformanceStats(options) {
    try {
      const topServices = await this.appointmentModel.aggregate([
        {
          $match: {
            deleted: false,
          },
        },
        {
          $unwind: "$reservations",
        },
        {
          $unwind: "$reservations.services",
        },
        {
          $group: {
            _id: "$reservations.services._id",
            serviceName: { $first: "$reservations.services.name" },
            servicePrice: { $first: "$reservations.services.price" },
            totalUsage: { $sum: 1 },
          },
        },
        {
          $sort: { totalUsage: -1 },
        },
        {
          $limit: options.filter?.topServicesLimit || 4,
        },
      ]);
      const topRevenuesPerDay = await this.appointmentModel.aggregate([
        {
          $match: {
            deleted: false,
          },
        },
        {
          $unwind: "$reservations",
        },
        {
          $unwind: "$reservations.services",
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              appointmentId: "$_id",
            },
            totalRevenue: { $sum: "$reservations.services.price" },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            totalRevenue: { $sum: "$totalRevenue" },
            appointments: { $push: { appointmentId: "$_id.appointmentId", totalRevenue: "$totalRevenue" } },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            appointments: 1,
            totalRevenue: 1,
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
        {
          $limit: options.filter?.topRevenuesLimit || 5,
        },
      ]);
      return {
        topServices,
        topRevenuesPerDay
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  // function to find one charge with id
  async findOne(id: String): Promise<Charge> {
    let options = {} as any;
    options.deleted = false;

    let charge = this.chargeModel.findById(id, options).select(['-password', '-createdBy', '-address']);
    const doesChargeExit = this.chargeModel.exists({ _id: id });

    return doesChargeExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find charge with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return charge;
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }
  // function to update one charge
  async update(
    id: string,
    updateChargeDto: UpdateChargeDto,
  ): Promise<Charge | undefined> {

    // Retrieve the existing charge from the database
    const existingCharge = await this.chargeModel.findById(id).exec();

    if (!existingCharge) {
      // Handle the case where the charge with the provided ID does not exist
      throw new HttpException('Charge not found', HttpStatus.NOT_FOUND);
    }
    const fields: UpdateChargeDto = {};
    for (const key in updateChargeDto) {
      if (typeof updateChargeDto[key] !== 'undefined') {
        fields[key] = updateChargeDto[key];
      }
    }

    updateChargeDto = fields;

    if (Object.keys(updateChargeDto).length > 0) {
      let charge: Charge | null = await this.chargeModel.findById(id);

      if (charge) {
        charge = await this.chargeModel.findByIdAndUpdate(id, updateChargeDto, { new: true }).exec();
        return charge;
      } else {
        throw new HttpException(`Could not find charge with id ${id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      // Throw an error or return a response to indicate no updates were made
      throw new HttpException('No fields to update.', HttpStatus.BAD_REQUEST);
    }
  }

  // soft delete charge record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string): Promise<Charge | undefined> {
    const charge = await this.chargeModel.findById(id);
    if (!charge) {
      throw new HttpException(
        `Could not find charge with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    charge.deleted = true;
    charge.deleted_at = new Date()
    await charge.save();
    return charge;
  }

  // restore charge deleted with soft delete
  async restore(id: string): Promise<Charge | undefined> {
    const charge = await this.chargeModel.findById(id);
    if (!charge) {
      throw new HttpException(
        `Could not find charge with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    charge.deleted = false;
    await charge.save();
    return charge;
  }

  // permanently delete charge
  async permaRemove(id: string): Promise<Charge | undefined> {
    const charge = await this.chargeModel.findById(id);
    if (!charge) {
      throw new HttpException(
        `Could not find charge with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the charge
    await this.chargeModel.deleteOne({ _id: id });
    return charge;
  }
  // function to bulk delete charges
  async bulkRemove(ids: string[]): Promise<Charge[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const charges = await this.chargeModel.find({ _id: { $in: objectIds } });
    if (!charges || charges.length === 0) {
      throw new HttpException(
        `could not find charges with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(charges.map(async (charge) => {
      await this.remove(charge._id)
      return charge;
    }));
  }
  getStartAndEndOfWeek(weekNumber: number): { startOfWeek: Date, endOfWeek: Date } {
    const date = new Date()
    const januaryFirst = new Date(date.getFullYear(), 0, 1);
    const daysToFirstMonday = (8 - januaryFirst.getDay()) % 7;

    const startDate = new Date(date.getFullYear(), 0, 1 + daysToFirstMonday + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + 6);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startOfWeek: startDate, endOfWeek: endDate };
  }
}
