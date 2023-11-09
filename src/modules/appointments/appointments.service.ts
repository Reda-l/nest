import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { Appointment } from 'src/core/types/interfaces/appointment.interface';
import { UsersService } from '../users/users.service';
import { EmailService } from 'src/core/shared/email.service';
import { User } from 'src/core/types/interfaces/user.interface';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel('Appointment') public readonly appointmentModel: Model<Appointment>,
    private userService: UsersService,
    private emailService: EmailService
  ) { }
  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment | undefined> {
    try {
      // save the appointment record
      const appointment = await this.appointmentModel.create({
        date: createAppointmentDto.date,
        time: createAppointmentDto.time,
        reservation: createAppointmentDto.reservation,
        bookingPersonDetails: createAppointmentDto.bookingPersonDetails,
        status: createAppointmentDto.status
      });
      if (appointment)
        // send email
        await this.emailService.sendEmail(['mazraoui.1996@gmail.com', appointment.reservation.email], 'Test Email');
      return appointment;
    } catch (error) {
      throw this.evaluateMongoError(error, createAppointmentDto);
    }
  }

  // function to get all appointments
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    const query = this.appointmentModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
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

  async findOne(id: string): Promise<Appointment> {
    try {
      const appointment = await this.appointmentModel.findById(id).populate({
        path: 'updatedBy',
        select: '_id firstname lastname username',
        model: 'User'
      }).exec();

      if (!appointment) {
        throw new HttpException(
          `Could not find appointment with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return appointment;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }


  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, authenticatedUser?: User): Promise<Appointment | undefined> {
    if (Object.entries(updateAppointmentDto).length > 0) {
      const appointment = await this.appointmentModel
        .findByIdAndUpdate(id, { ...updateAppointmentDto, updatedBy: authenticatedUser?._id }, { new: true })
        .populate({
          path: 'updatedBy',
          select: '_id firstname lastname username',
          model: 'User'
        })
        .exec();

      if (!appointment) {
        throw new HttpException(
          `Could not find appointment with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return appointment;
    } else {
      throw new HttpException(
        'No updates provided for the appointment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  // soft delete Appointment record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string, authenticatedUser?: User): Promise<Appointment | undefined> {
    const appointment = await this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          deleted: true, // field to mark soft deletion
          updatedBy: authenticatedUser?._id,
        },
        { new: true }
      )
      .populate({
        path: 'updatedBy',
        select: '_id firstname lastname username',
        model: 'User'
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
