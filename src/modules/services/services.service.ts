import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { Service } from 'src/core/types/interfaces/service.interface';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel('Service') public readonly serviceModel: Model<Service>,
  ) { }

  async create(createServiceDto: CreateServiceDto): Promise<Service | undefined> {
    try {
      // Generate slug from the name
      const slug = createServiceDto.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/ /g, '_');
      // Add the slug to the DTO
      createServiceDto.slug = slug;

      // Save the service record
      const service = await this.serviceModel.create(createServiceDto);
      return service;
    } catch (error) {
      throw this.evaluateMongoError(error, createServiceDto);
    }
  }


  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    const query = this.serviceModel.find(options.filter);

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.select && options.select !== '') {
      query.select(options.select);
    }

    const page: number = parseInt(options.page as any) || 1;
    const limit: number = parseInt(options.limit as any) || 10;
    const total = await this.serviceModel.countDocuments(options.filter);
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

  findOne(id: number) {
    return `This action returns a #${id} service`;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    try {
      // Check if 'name' field is being updated
      if (updateServiceDto.name) {
        updateServiceDto.slug = updateServiceDto.name.toLowerCase().replace(/ /g, '_');
      }
      const updatedService = await this.serviceModel.findByIdAndUpdate(id, updateServiceDto, { new: true });

      if (!updatedService) {
        throw new HttpException(`Service with id ${id} not found`, HttpStatus.NOT_FOUND);
      }

      return updatedService;
    } catch (error) {
      throw new HttpException(`Error updating service: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} service`;
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
    dto: any,
  ): Error {
    throw new Error(error.message);
  }
}
