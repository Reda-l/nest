import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Charge } from 'src/core/types/interfaces/charge.interface';
import { Appointment } from 'src/core/types/interfaces/appointment.interface';
import { uploadFirebaseFile } from 'src/core/shared/firebaseUpload';
import { formatDate, parseDate } from 'src/core/shared/date.utils';
import * as moment from 'moment';

@Injectable()
export class ChargesService {
  constructor(
    @InjectModel('Charge') public readonly chargeModel: Model<Charge>,
    @InjectModel('Appointment')
    public readonly appointmentModel: Model<Appointment>,
  ) {}
  // function to create Charge
  async create(createChargeDto: CreateChargeDto): Promise<any> {
    if (createChargeDto.date)
      createChargeDto.date = parseDate(createChargeDto.date);
    let createdCharge = new this.chargeModel(createChargeDto);
    let charge: Charge | undefined;
    try {
      // //upload image
      if (createChargeDto.image && typeof createChargeDto.image === 'object') {
        const imageUrl = await uploadFirebaseFile(
          createChargeDto.image,
          'spa-charges',
        );
        createdCharge.image = imageUrl;
      }
      charge = await createdCharge.save();
      if (charge) {
        return {
          _id: charge._id,
          name: charge.name,
          price: charge.price,
          payment: charge.payment,
          reason: charge.reason,
          date: formatDate(new Date(charge.date)),
          responsable: charge.responsable,
          image: charge.image,
          type: charge.type,
          created_at: charge.created_at,
          updated_at: charge.updated_at,
        };
      } else {
        throw new HttpException(
          'Error occured, cannot update charge',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.log('🚀 ~ ChargesService ~ create ~ error:', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All charges
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    // Parse date strings in DD-MM-YYYY format into Date objects
    if (options.filter?.date) {
      for (const operator in options.filter.date) {
        if (options.filter.date.hasOwnProperty(operator)) {
          if (['$gte', '$gt', '$lte', '$lt'].includes(operator)) {
            options.filter.date[operator] = parseDate(
              options.filter.date[operator],
            );
          }
        }
      }
    }
    if (options.filter?.week) {
      const { startOfWeek, endOfWeek } = this.getStartAndEndOfWeek(
        options.filter?.week,
      );
      options.filter.date = {
        $gte: startOfWeek,
        $lt: endOfWeek,
      };
      delete options.filter?.week;
    }
    if (options.filter?.today) {
      const startOfDay = new Date();
      const endOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
      options.filter.date = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
      delete options.filter?.today;
    }
    if (options.filter?.year) {
      const currentYear = options.filter?.year || new Date().getFullYear();
      const firstDay = new Date(currentYear, 0, 1);
      const lastDay = new Date(currentYear, 11, 31);
      options.filter.date = {
        $gte: firstDay,
        $lt: lastDay,
      };
      delete options.filter?.year;
    }
    if (options.filter?.month) {
      var date = new Date();
      const month = options.filter?.month || date.getMonth();
      var firstDay = new Date(date.getFullYear(), month, 1);
      var lastDay = new Date(date.getFullYear(), month + 1, 0);
      options.filter.date = {
        $gte: firstDay,
        $lt: lastDay,
      };
      delete options.filter?.month;
    }
    const query = this.chargeModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

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
    const formatedData = data.map((doc) => {
      return {
        _id: doc._id,
        name: doc.name,
        price: doc.price,
        payment: doc.payment,
        reason: doc.reason,
        date: formatDate(new Date(doc.date)),
        responsable: doc.responsable,
        image: doc.image,
        type: doc.type,
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
  //function to get stats
  async getStats(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      options.filter.startDate = parseDate(options.filter.startDate);
      // Parse and format end date to ISODate
      options.filter.endDate = parseDate(options.filter.endDate);

      let currentDate = new Date(options.filter.startDate);
      const totalsPerDay: any = [];
      let _totalRevenue = 0;
      let _totalCharges = 0;
      let _totalProfit = 0;
      // Loop until the current date is greater than the end date
      while (currentDate <= options.filter.endDate) {
        const totalChargesPerDay = await this.chargeModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate,
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$price' },
            },
          },
          {
            $project: {
              _id: 0, // Exclude _id from the result
              totalPrice: 1,
            },
          },
        ]);
        const totalRevenuePerDay = await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate,
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$reservations.services.price' },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
            },
          },
        ]);
        const _totalRevenuePerDay =
          totalRevenuePerDay.length > 0
            ? totalRevenuePerDay[0].totalPrice -
              (await this.getTotalDiscount(currentDate, currentDate))
            : 0;
        const _totalChargesPerDay =
          totalChargesPerDay.length > 0 ? totalChargesPerDay[0].totalPrice : 0;
        const _totalProfitPerDay = _totalRevenuePerDay - _totalChargesPerDay;

        _totalRevenue += _totalRevenuePerDay;
        _totalCharges += _totalChargesPerDay;
        _totalProfit += _totalProfitPerDay;
        totalsPerDay.push({
          revenue: _totalRevenuePerDay,
          time: formatDate(currentDate),
          expenses: _totalChargesPerDay,
          profit: _totalProfitPerDay,
        });
        // Increment the current date by one day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        totalsPerDay,
        totalRevenue: _totalRevenue,
        totalCharges: _totalCharges,
        totalProfit: _totalProfit,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getTopPerformanceStats(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      const startDate = parseDate(options.filter.startDate);
      const endDate = parseDate(options.filter.endDate);

      const topServices = await this.appointmentModel.aggregate([
        {
          $match: {
            deleted: false,
            date: { $gte: startDate, $lte: endDate },
            status: 'PAYED', // Only count appointments with status PAYED
          },
        },
        {
          $unwind: '$reservations',
        },
        {
          $unwind: '$reservations.services',
        },
        {
          $group: {
            _id: '$reservations.services._id',
            serviceName: { $first: '$reservations.services.name' },
            servicePrice: { $first: '$reservations.services.price' },
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
            date: { $gte: startDate, $lte: endDate },
            status: 'PAYED', // Only count appointments with status PAYED
          },
        },
        {
          $unwind: '$reservations',
        },
        {
          $unwind: '$reservations.services',
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              appointmentId: '$_id',
            },
            totalRevenue: { $sum: '$reservations.services.price' },
          },
        },
        {
          $group: {
            _id: '$_id.date',
            totalRevenue: { $sum: '$totalRevenue' },
            appointments: {
              $push: {
                appointmentId: '$_id.appointmentId',
                totalRevenue: '$totalRevenue',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
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
      const topSources = await this.appointmentModel.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            source: { $ne: null },
            deleted: false,
          },
        },
        {
          $group: {
            _id: '$source', // Group by source
            count: { $sum: 1 }, // Count occurrences
          },
        },
        {
          $project: {
            _id: 0,
            count: 1,
            source: '$_id',
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
      const appointments = await this.appointmentModel.find({
        $and: [
          { 'commission.value': { $exists: true } },
          { date: { $gte: startDate, $lte: endDate } },
          { deleted: false },
        ],
      });

      const commissionData = appointments.map((appointment) => {
        let commissionValue = 0;
        if (appointment.commission.type === '%') {
          const totalServicePrice = appointment.reservations.reduce(
            (total, reservation) => {
              return (
                total +
                reservation.services.reduce(
                  (subtotal, service) => subtotal + service.price,
                  0,
                )
              );
            },
            0,
          );
          commissionValue =
            (totalServicePrice * appointment.commission.value) / 100;
        } else {
          commissionValue = appointment.commission.value;
        }
        // Convert source to lowercase
        const source = appointment.source.toLowerCase();
        return { source, value: commissionValue };
      });

      // Grouping commissionData
      const groupedCommissionData = commissionData.reduce(
        (accumulator, currentValue) => {
          const { source, value } = currentValue;
          if (!accumulator[source]) {
            accumulator[source] = { source, value: value };
          } else {
            accumulator[source].value += value;
          }
          return accumulator;
        },
        {},
      );

      const groupedCommissionArray = Object.values(groupedCommissionData);

      return {
        topServices,
        topRevenuesPerDay,
        topSources,
        commissionData: groupedCommissionArray,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  async getProgressStats(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      options.filter.startDate = parseDate(options.filter.startDate);
      // Parse and format end date to ISODate
      options.filter.endDate = parseDate(options.filter.endDate);
      const { previousMonthEndDate, previousMonthStartDate } =
        this.getPreviousMonthDateRange(
          options.filter?.startDate,
          options.filter?.endDate,
        );
      options.filter.startDate = new Date(options.filter.startDate);
      options.filter.endDate = new Date(options.filter.endDate);
      let currentMonthTotalCharges: any | number =
        await this.chargeModel.aggregate([
          {
            $match: {
              deleted: false,
              date: {
                $gte: options.filter.startDate, // Start date
                $lte: options.filter.endDate, // End date
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$price' },
            },
          },
          {
            $project: {
              _id: 0, // Exclude _id from the result
              totalPrice: 1,
            },
          },
        ]);

      let currentMonthTotalRevenue: any | number =
        await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: {
                $gte: options.filter.startDate, // Start date
                $lte: options.filter.endDate, // End date
              },
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              appointments: { $push: '$$ROOT' },
              totalPrice: { $sum: '$reservations.services.price' },
              totalClients: { $addToSet: '$reservations._id' },
              count: { $sum: 1 }, // Count the total number of reservations
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
              // appointments: 1,
              totalClients: { $size: '$totalClients' },
              totalCount: '$count',
            },
          },
        ]);

      const currentMonthClients =
        currentMonthTotalRevenue.length > 0
          ? currentMonthTotalRevenue[0].totalClients
          : 0;

      currentMonthTotalRevenue =
        currentMonthTotalRevenue.length > 0
          ? currentMonthTotalRevenue[0].totalPrice -
            (await this.getTotalDiscount(
              options.filter.startDate,
              options.filter.endDate,
            ))
          : 0;
      currentMonthTotalCharges =
        currentMonthTotalCharges.length > 0
          ? currentMonthTotalCharges[0].totalPrice
          : 0;
      const currentMonthProfit =
        currentMonthTotalRevenue - currentMonthTotalCharges;
      let previousMonthTotalCharges: any | number =
        await this.chargeModel.aggregate([
          {
            $match: {
              deleted: false,
              date: {
                $gte: previousMonthStartDate, // Start date
                $lte: previousMonthEndDate, // End date
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$price' },
            },
          },
          {
            $project: {
              _id: 0, // Exclude _id from the result
              totalPrice: 1,
            },
          },
        ]);
      let previousMonthTotalRevenue: any | number =
        await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: {
                $gte: previousMonthStartDate, // Start date
                $lte: previousMonthEndDate, // End date
              },
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              appointments: { $push: '$$ROOT' },
              totalPrice: { $sum: '$reservations.services.price' },
              totalClients: { $addToSet: '$reservations.fullname' },
              count: { $sum: 1 }, // Count the total number of reservations
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
              // appointments: 1,
              totalClients: { $size: '$totalClients' },
              totalCount: '$count',
            },
          },
        ]);
      const previousMonthClients =
        previousMonthTotalRevenue.length > 0
          ? previousMonthTotalRevenue[0].totalClients
          : 0;
      previousMonthTotalCharges =
        previousMonthTotalCharges.length > 0
          ? previousMonthTotalCharges[0].totalPrice
          : 0;
      previousMonthTotalRevenue =
        previousMonthTotalRevenue.length > 0
          ? previousMonthTotalRevenue[0].totalPrice -
            (await this.getTotalDiscount(
              options.filter.startDate,
              options.filter.endDate,
            ))
          : 0;
      const previousMonthProfit =
        previousMonthTotalRevenue - previousMonthTotalCharges;


      return {
        expenses: {
          value: currentMonthTotalCharges,
          percentage:
            ((currentMonthTotalCharges - previousMonthTotalCharges) /
              previousMonthTotalCharges) *
            100,
        },
        revenues: {
          value: currentMonthTotalRevenue,
          percentage:
            ((currentMonthTotalRevenue - previousMonthTotalRevenue) /
              previousMonthTotalRevenue) *
            100,
        },
        profite: {
          value: currentMonthProfit,
          percentage:
            ((currentMonthProfit - previousMonthProfit) / previousMonthProfit) *
            100,
        },
        clients: {
          value: currentMonthClients - previousMonthClients,
          percentage:
            ((currentMonthClients - previousMonthClients) /
              previousMonthClients) *
            100,
        },
      };
    } catch (error) {
      console.log('🚀 ~ ChargesService ~ getProgressStats ~ error:', error);
    }
  }
  // function to find one charge with id
  async findOne(id: String): Promise<Charge> {
    let options = {} as any;
    options.deleted = false;

    let charge = await this.chargeModel
      .findById(id, options)
      .select(['-password', '-createdBy', '-address']);
    const doesChargeExit = this.chargeModel.exists({ _id: id });

    return doesChargeExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find charge with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return {
          ...charge.toObject(),
          date: formatDate(new Date(charge.date)),
        };
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
    try {
      // //upload image
      if (updateChargeDto.image && typeof updateChargeDto.image === 'object') {
        const imageUrl = await uploadFirebaseFile(
          updateChargeDto.image,
          'spa-charges',
        );
        updateChargeDto.image = imageUrl;
      }
      if (updateChargeDto.date)
        updateChargeDto.date = parseDate(updateChargeDto.date);
      const updatedCharge = await this.chargeModel.findByIdAndUpdate(
        id,
        updateChargeDto,
        { new: true },
      );

      if (!updatedCharge) {
        throw new HttpException(
          `charge with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        ...updatedCharge.toObject(),
        date: formatDate(new Date(updatedCharge.date)),
      };
    } catch (error) {
      throw new HttpException(
        `Error updating charge: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    charge.deleted_at = new Date();
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
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const charges = await this.chargeModel.find({ _id: { $in: objectIds } });
    if (!charges || charges.length === 0) {
      throw new HttpException(
        `could not find charges with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(
      charges.map(async (charge) => {
        await this.remove(charge._id);
        return charge;
      }),
    );
  }
  getPreviousMonthDateRange(startDate, endDate) {
    // Calculate the start date of the previous month
    const previousMonthStartDate = new Date(startDate);
    previousMonthStartDate.setMonth(previousMonthStartDate.getMonth() - 1);

    // Calculate the end date of the previous month
    const previousMonthEndDate = new Date(endDate);
    previousMonthEndDate.setMonth(previousMonthEndDate.getMonth() - 1);

    return {
      previousMonthStartDate,
      previousMonthEndDate,
    };
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

  async getTotalDiscount(startDate: Date, endDate: Date) {
    let totalDiscount = 0;

    // Fetch appointments between the given dates and populate the 'discount' field
    const appointments = await this.appointmentModel
      .find({
        deleted: false,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate('discount');

    // Iterate through each appointment
    for (const appointment of appointments) {
      let totalPrice = 0;

      // Calculate total price from reservations
      for (const reservation of appointment.reservations) {
        for (const service of reservation.services) {
          totalPrice += service.price;
        }
      }

      // Check if discount exists
      if (appointment.discount) {
        // Calculate discount amount based on discount type
        if (appointment.discount.type === 'PERCENT') {
          totalDiscount += (totalPrice * appointment.discount.value) / 100;
        } else if (appointment.discount.type === 'CURRENCY') {
          totalDiscount += appointment.discount.value;
        }
      }
    }
    return totalDiscount | 0;
    // console.log("🚀 ~ ChargesService ~ getTotalDiscount ~ totalDiscount:", totalDiscount)
  }

  // function for report - SPA stats
  // function for report get revenus of SPA
  async getSpaRevenus(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      options.filter.startDate = parseDate(options.filter.startDate);
      // Parse and format end date to ISODate
      options.filter.endDate = parseDate(options.filter.endDate);

      let currentDate = new Date(options.filter.startDate);
      const totalsPerDay: any = [];
      let _totalRevenue = 0;
      let _totalCharges = 0;
      let _totalProfit = 0;
      let _totalCredits = 0; // Initialize total credits
      let _totalBeldiRevenue = 0; // Initialize total Beldi revenue

      // Loop until the current date is greater than the end date
      while (currentDate <= options.filter.endDate) {
        const totalChargesPerDay = await this.chargeModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate,
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$price' },
            },
          },
          {
            $project: {
              _id: 0, // Exclude _id from the result
              totalPrice: 1,
            },
          },
        ]);
        const totalRevenuePerDay = await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate,
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$reservations.services.price' },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
            },
          },
        ]);
        const totalBeldiRevenuePerDay = await this.appointmentModel.aggregate([
          {
            $match: {
              deleted: false,
              date: currentDate,
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $match: {
              'reservations.services.type': 'Beldi',
            },
          },
          {
            $group: {
              _id: null,
              totalPrice: { $sum: '$reservations.services.price' },
            },
          },
          {
            $project: {
              _id: 0,
              totalPrice: 1,
            },
          },
        ]);
        const totalCreditPerDay = await this.appointmentModel
          .aggregate([
            {
              $match: {
                deleted: false,
                date: currentDate,
                status: 'PAYED', // Only count appointments with status PAYED
                'payment.debitPaymentMethod': 'CARD',
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$payment.debitDevise' },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
              },
            },
          ])
          .exec();
        const _totalRevenuePerDay =
          totalRevenuePerDay.length > 0
            ? totalRevenuePerDay[0].totalPrice -
              (await this.getTotalDiscount(currentDate, currentDate))
            : 0;
        const _totalChargesPerDay =
          totalChargesPerDay.length > 0 ? totalChargesPerDay[0].totalPrice : 0;
        const _totalProfitPerDay = _totalRevenuePerDay - _totalChargesPerDay;
        const _totalCreditPerDay =
          totalCreditPerDay.length > 0 ? totalCreditPerDay[0].total : 0; // Extract credit total

          const _totalBeldiRevenuePerDay =
          totalBeldiRevenuePerDay.length > 0
            ? totalBeldiRevenuePerDay[0].totalPrice
            : 0; // Calculate total Beldi revenue per day

        _totalRevenue += _totalRevenuePerDay;
        _totalCharges += _totalChargesPerDay;
        _totalProfit += _totalProfitPerDay;
        _totalCredits += _totalCreditPerDay; // Add credit total to overall credits
        _totalBeldiRevenue += _totalBeldiRevenuePerDay;

        totalsPerDay.push({
          date: formatDate(currentDate),
          beldi: _totalBeldiRevenuePerDay,
          spa: _totalRevenuePerDay - _totalBeldiRevenuePerDay,
          total: _totalRevenuePerDay,
          depenses: _totalChargesPerDay,
          net: _totalRevenuePerDay - _totalChargesPerDay,
          credits: _totalCreditPerDay, // Add credits to daily totals
        });
        // Increment the current date by one day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        data: totalsPerDay,
        totalBeldi: _totalBeldiRevenue, 
        totalSpa: _totalRevenue,
        totalDepenses: _totalCharges,
        totalCredits: _totalCredits, // Include total credits in the returned object
        totalNet: _totalProfit,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // function for report - Charges grouped with total
  async getChargesReport(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      const startDate = parseDate(options.filter.startDate);
      const endDate = parseDate(options.filter.endDate);
  
      const aggregationPipeline = [
        {
          $match: {
            deleted: false,
            date: { $gte: startDate, $lte: endDate }, // Filter by date range
          },
        },
        {
          $group: {
            _id: {
              name: '$name', // Group by name
              type: '$type'  // Include type in the grouping
            },
            totalPrice: { $sum: '$price' }, // Calculate total price for each group
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            name: { $concat: ['(', '$_id.name', ')',' ','$_id.type'] }, // Format name as (type)name
            totalPrice: 1, // Include totalPrice field
          },
        },
      ];
  
      const charges = await this.chargeModel.aggregate(aggregationPipeline).exec();
      return charges;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  

  // function for payments report
  async getPaymentsReport(options) {
    console.log(options);
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Parse and format start date to ISODate
      const startDate = parseDate(options.filter.startDate);
      const endDate = parseDate(options.filter.endDate);
  
      const aggregationPipeline = [
        {
          $match: {
            deleted: false,
            date: { $gte: startDate, $lte: endDate }, // Filter by date range
            payment: { $ne: null }, // Exclude documents where payment is null
          },
        },
        {
          $group: {
            _id: '$payment', // Group by payment
            totalDepenses: { $sum: '$price' }, // Calculate total price for each group
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id field
            type: '$_id', // Rename _id to name
            totalDepenses: 1, // Include totalPrice field
          },
        },
      ];
  
      const caisse = await this.appointmentModel
        .aggregate([
          {
            $match: {
              deleted: false,
              date: { $gte: startDate, $lte: endDate }, // Filter by date range
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$reservations.services.price' },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
            },
          },
        ])
        .exec();
  
      const banque = await this.appointmentModel
        .aggregate([
          {
            $match: {
              deleted: false,
              date: { $gte: startDate, $lte: endDate }, // Filter by date range
              'payment.debitPaymentMethod': 'CARD',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$payment.debitDevise' },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
            },
          },
        ])
        .exec();
  
      const totalRevenu = await this.appointmentModel
        .aggregate([
          {
            $match: {
              deleted: false,
              date: { $gte: startDate, $lte: endDate }, // Filter by date range
              status: 'PAYED', // Only count appointments with status PAYED
            },
          },
          {
            $unwind: '$reservations',
          },
          {
            $unwind: '$reservations.services',
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$reservations.services.price' },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
            },
          },
        ])
        .exec();
  
      const charges = await this.chargeModel
        .aggregate(aggregationPipeline)
        .exec();
  
      // Handling empty results
      const totalRevenuValue = totalRevenu.length > 0 ? totalRevenu[0].total : 0;
      const caisseValue = caisse.length > 0 ? caisse[0].total : 0;
      const banqueValue = banque.length > 0 ? banque[0].total : 0;
      // const totalDepenses = charges.reduce((sum, charge) => sum + (charge.totalDepenses || 0), 0);
  
      return {
        totalNet: totalRevenuValue,
        charges: charges.length > 0 ? charges : [],
        caisse: caisseValue - banqueValue,
        banque: banqueValue,

      };
    } catch (error) {
      console.log("🚀 ~ ChargesService ~ getPaymentsReport ~ error:", error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  
}
