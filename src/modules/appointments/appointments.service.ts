import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { Appointment } from 'src/core/types/interfaces/appointment.interface';
import { UsersService } from '../users/users.service';
import { EmailService } from 'src/core/shared/email.service';
import { User } from 'src/core/types/interfaces/user.interface';
import { Service } from 'src/core/types/interfaces/service.interface';
import { formatDate, parseDate } from 'src/core/shared/date.utils';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel('Appointment')
    public readonly appointmentModel: Model<Appointment>,
    @InjectModel('Service') public readonly serviceModel: Model<Service>,
    private userService: UsersService,
    private emailService: EmailService,
  ) {}
  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<any | undefined> {
    try {
      if (createAppointmentDto.date)
        createAppointmentDto.date = parseDate(
          createAppointmentDto.date.toString(),
        );

      // Save the appointment record
      const appointment = await this.appointmentModel.create({
        ...createAppointmentDto,
        date: createAppointmentDto.date,
        time: createAppointmentDto.time,
        reservations: createAppointmentDto.reservations,
        bookingPersonDetails: createAppointmentDto.bookingPersonDetails,
        status: createAppointmentDto.status,
      });

      //TODO : booking details not required when source is local
      // reservations name + gender not required when source local
      if (appointment) {
        // Send email
        const bookingPersonEmail =
          createAppointmentDto.bookingPersonDetails.email;
        const adminEmails = [
          'mazraoui.1996@gmail.com',
          'contact@spadesepices.com',
        ];
        const context = {
          fullName: appointment.bookingPersonDetails.fullname,
          date: new Date(appointment.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: appointment.time,
          id: appointment._id,
        };
        // // send email to admins
        // await this.emailService.sendEmail(adminEmails, 'New Appointment Received', 'admin-confirmation', context);
        // // send email to clients
        // await this.emailService.sendEmail(bookingPersonEmail, 'Your Appointment Confirmation', 'client-confirmation', context);
      }

      const _appointment = await this.findOne(appointment._id);

      return _appointment;
    } catch (error) {
      console.log(
        '🚀 ~ file: appointments.service.ts:75 ~ AppointmentsService ~ create ~ error:',
        error,
      );
      throw this.evaluateMongoError(error, createAppointmentDto);
    }
  }

  // function to get all appointments
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    // Parse date strings in DD-MM-YYYY format into Date objects
    if (options.filter?.date) {
      if (typeof options.filter.date === 'string') {
        options.filter.date = parseDate(options.filter.date);
      } else {
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
    }
      if (options.filter?.commission?.payed) {
        options.filter['commission.value'] = { $gt: 0 };
      }
    
    const query = this.appointmentModel.find(options.filter);

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
    const total = await this.appointmentModel.countDocuments(options.filter);
    const count = total < limit ? total : limit;
    const lastPage = Math.max(Math.ceil(total / limit), 1);
    const startIndex = (page - 1) * count;
    const endIndex = Math.min(count * page, count);

    const data = await query
      .skip((page - 1) * count)
      .limit(count)
      .populate({
        path: 'discount',
        model: 'Discount',
        select: '-deleted -created_at -updated_at -__v',
      })
      .exec();
    const formatedData = data.map((doc) => {
      return {
        time: doc.time,
        _id: doc._id,
        reservations: doc.reservations,
        bookingPersonDetails: doc.bookingPersonDetails,
        status: doc.status,
        updatedBy: doc.updatedBy,
        discount: doc.discount,
        payment: doc.payment,
        source: doc.source,
        deposit: doc.deposit,
        commission: doc.commission,
        date: formatDate(new Date(doc.date)),
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      };
    });
    return {
      data: formatedData,
      count,
      total,
      lastPage,
      startIndex,
      endIndex,
      page,

      pageCount: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Appointment> {
    try {
      let options = {} as any;
      options.deleted = false;
      const appointment = await this.appointmentModel
        .findById(id, options)
        .populate({
          path: 'updatedBy',
          select: '_id firstname lastname',
          model: 'User',
        })
        .populate({
          path: 'discount',
          model: 'Discount',
          select: '-deleted -created_at -updated_at -__v',
        })
        .exec();
      if (!appointment) {
        throw new HttpException(
          `Could not find appointment with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        ...appointment.toObject(),
        date: formatDate(new Date(appointment.date)),
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    authenticatedUser?: User,
  ): Promise<Appointment | undefined> {
    if (Object.entries(updateAppointmentDto).length > 0) {
      if (updateAppointmentDto.date)
        updateAppointmentDto.date = parseDate(
          updateAppointmentDto.date.toString(),
        );
      // Check if the status is set to 'CANCELED'
      const isCanceled = updateAppointmentDto.status === 'CANCELED';
      // Check if the status is set to 'CONFIRMED'
      const isConfirmed = updateAppointmentDto.status === 'CONFIRMED';

      const appointment = await this.appointmentModel
        .findByIdAndUpdate(
          id,
          { ...updateAppointmentDto, updatedBy: authenticatedUser?._id },
          { new: true },
        )
        .populate({
          path: 'updatedBy',
          select: '_id firstname lastname',
          model: 'User',
        })
        .populate({
          path: 'discount',
          model: 'Discount',
          select: '-deleted -created_at -updated_at -__v',
        })
        .exec();

      if (!appointment) {
        throw new HttpException(
          `Could not find appointment with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // If the status is set to 'CANCELED', send an email
      if (isCanceled) {
        const bookingPersonEmail = appointment.bookingPersonDetails.email;
        const emailSubject = 'Canceled Appointment';
        const emailTemplate = 'cancel-appointment';
        const context = {
          fullName: appointment.bookingPersonDetails.fullname,
        }; // Add any additional data needed for the email template

        // await this.emailService.sendEmail(bookingPersonEmail, emailSubject, emailTemplate, context);
      }

      // If the status is set to 'CONFIRMED', send an email to the Admins
      if (isConfirmed) {
        const adminEmails = [
          'mazraoui.1996@gmail.com',
          'contact@spadesepices.com',
        ];
        const emailSubject = 'Confirmed Appointment';
        const emailTemplate = 'confirm-appointment';
        const context = {
          fullName: appointment.bookingPersonDetails.fullname,
          date: new Date(appointment.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: appointment.time,
        }; // Add any additional data needed for the email template

        // await this.emailService.sendEmail(adminEmails, emailSubject, emailTemplate, context);
      }

      return {
        ...appointment.toObject(),
        date: formatDate(new Date(appointment.date)),
      };
    } else {
      throw new HttpException(
        'No updates provided for the appointment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // soft delete Appointment record by id ( set deleted to true and deleted_at to date now )
  async remove(
    id: string,
    authenticatedUser?: User,
  ): Promise<Appointment | undefined> {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          deleted: true, // field to mark soft deletion
          updatedBy: authenticatedUser?._id,
        },
        { new: true },
      )
      .populate({
        path: 'updatedBy',
        select: '_id firstname lastname',
        model: 'User',
      })
      .exec();

    if (!appointment) {
      throw new HttpException(
        `Could not find appointment with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    return appointment;
  }

  //function to get and calculate commision with source
  async getAppointmentCommision(options) {
    try {
      if (!options.filter?.startDate || !options.filter?.endDate) {
        throw new HttpException(
          'filter dates are missing',
          HttpStatus.BAD_REQUEST,
        );
      }
      const startDate = new Date(options.filter?.startDate);
      const endDate = new Date(options.filter?.endDate);

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
        return { source: appointment.source, value: commissionValue };
      });

      return commissionData;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
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
  private evaluateMongoError(
    error: MongooseError,
    createFlowchartDto: any,
  ): Error {
    throw new Error(error.message);
  }
}
