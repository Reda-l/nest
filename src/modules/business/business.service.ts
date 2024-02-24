import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from 'src/core/types/interfaces/business.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { uploadFirebaseFile } from 'src/core/shared/firebaseUpload';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel('Business') public readonly chargeModel: Model<Business>,
  ) { }
  // function to create Business
  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    // //upload image
    if (createBusinessDto.logo && typeof createBusinessDto.logo === 'object') {
      const imageUrl = await uploadFirebaseFile(createBusinessDto.logo, 'logos')
      createBusinessDto.logo = imageUrl
    }
    let createdBusiness = new this.chargeModel(createBusinessDto);
    let business: Business | undefined;
    try {
      business = await createdBusiness.save();
      if (business) {
        return business;
      } else {
        throw new HttpException(
          'Error occured, cannot update business',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All businesses
  async findAll(options): Promise<any> {
    options.filter.deleted = false;
    const query = this.chargeModel.find(options.filter);

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
      count,
      total,
      lastPage,
      startIndex,
      endIndex,
      page,

      pageCount: Math.ceil(total / limit),
    };
  }

  // function to find one business with id
  async findOne(id: String): Promise<Business> {
    let options = {} as any;
    options.deleted = false;

    let business = this.chargeModel.findById(id, options);
    const doesBusinessExit = this.chargeModel.exists({ _id: id, options });

    return doesBusinessExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find business with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return business;
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }
  // function to update one business
  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<Business | undefined> {

    // Retrieve the existing business from the database
    const existingBusiness = await this.chargeModel.findById(id).exec();

    if (!existingBusiness) {
      // Handle the case where the business with the provided ID does not exist
      throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
    }
    // //upload image
    if (updateBusinessDto.logo && typeof updateBusinessDto.logo === 'object') {
      const imageUrl = await uploadFirebaseFile(updateBusinessDto.logo, 'logos')
      updateBusinessDto.logo = imageUrl
    }
    const fields: UpdateBusinessDto = {};
    for (const key in updateBusinessDto) {
      if (typeof updateBusinessDto[key] !== 'undefined') {
        fields[key] = updateBusinessDto[key];
      }
    }

    updateBusinessDto = fields;

    if (Object.keys(updateBusinessDto).length > 0) {
      let business: Business | null = await this.chargeModel.findById(id);

      if (business) {
        business = await this.chargeModel.findByIdAndUpdate(id, updateBusinessDto, { new: true }).exec();
        return business;
      } else {
        throw new HttpException(`Could not find business with id ${id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      // Throw an error or return a response to indicate no updates were made
      throw new HttpException('No fields to update.', HttpStatus.BAD_REQUEST);
    }
  }

  // soft delete business record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string): Promise<Business | undefined> {
    const business = await this.chargeModel.findById(id);
    if (!business) {
      throw new HttpException(
        `Could not find business with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    business.deleted = true;
    business.deleted_at = new Date()
    await business.save();
    return business;
  }

  // restore business deleted with soft delete
  async restore(id: string): Promise<Business | undefined> {
    const business = await this.chargeModel.findById(id);
    if (!business) {
      throw new HttpException(
        `Could not find business with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    business.deleted = false;
    await business.save();
    return business;
  }

  // permanently delete business
  async permaRemove(id: string): Promise<Business | undefined> {
    const business = await this.chargeModel.findById(id);
    if (!business) {
      throw new HttpException(
        `Could not find business with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the business
    await this.chargeModel.deleteOne({ _id: id });
    return business;
  }
  // function to bulk delete businesses
  async bulkRemove(ids: string[]): Promise<Business[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const businesses = await this.chargeModel.find({ _id: { $in: objectIds } });
    if (!businesses || businesses.length === 0) {
      throw new HttpException(
        `could not find businesses with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(businesses.map(async (business) => {
      await this.remove(business._id)
      return business;
    }));
  }
}
