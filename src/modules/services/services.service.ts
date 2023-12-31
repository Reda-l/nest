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
      // Save the service record
      const service = await this.serviceModel.create(createServiceDto);
      return service;
    } catch (error) {
      throw this.evaluateMongoError(error, createServiceDto);
    }
  }


  async findAll(options): Promise<any> {
    options.filter.deleted = false;

    const query = this.serviceModel.find(options.filter).sort({ created_at: 1 });

    const data = await query.exec();

    // Group the data by the 'type' field
    const groupedData = Object.values(
      data.reduce((acc, item : any) => {
        const type = item.type;
        acc[type] = acc[type] || { _id: type, count: 0, data: [] };
        acc[type].count++;
        acc[type].data.push({
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image,
          type: item.type,
          time: item.time,
          description: item.description,
        });
        return acc;
      }, {})
    );

    return { groupedData };

    // // Group the data by the 'type' field
    // const groupedData = this.groupBy(data, 'type');

    // return groupedData;


    // // Aggregation pipeline to group by type and include specified fields
    // const aggregationPipeline: any[] = [
    //   { $match: options.filter },
    //   { $sort: { created_at: 1 } }, // Sort before grouping
    //   {
    //     $group: {
    //       _id: "$type",
    //       data: { $push: "$$ROOT" }, // Collect the entire document into an array
    //       count: { $sum: 1 },
    //     }
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       data: {
    //         $map: {
    //           input: "$data",
    //           as: "doc",
    //           in: {
    //             _id: "$$doc._id",
    //             name: "$$doc.name",
    //             price: "$$doc.price",
    //             image: "$$doc.image",
    //             type: "$$doc.type",
    //             time: "$$doc.time",
    //             description: "$$doc.description",
    //             created_at: "$$doc.created_at",
    //           },
    //         },
    //       },
    //       count: 1,
    //     },
    //   },
    // ];

    // const groupedData = await this.serviceModel.aggregate(aggregationPipeline).exec();

    // return {
    //   groupedData,
    // };


  }

  groupBy(array: any[], key: string): { [key: string]: any[] } {
    return array.reduce((result, currentValue) => {
      const currentKey = currentValue[key];
      (result[currentKey] = result[currentKey] || []).push(currentValue);
      return result;
    }, {});
  }




  async findOne(id: string): Promise<Service> {
    try {
      let options = {} as any;
      options.deleted = false;
      const service = await this.serviceModel
        .findById(id, options)
        .select('-deleted -created_at -updated_at -__v')
        .exec();
      if (!service) {
        throw new HttpException(
          `Could not find service with id ${id}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return service;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }


  async update(id: string, updateServiceDto: UpdateServiceDto) {
    try {
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
