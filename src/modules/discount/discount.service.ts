import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Discount } from 'src/core/types/interfaces/discount.interface';

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel('Discount') public readonly chargeModel: Model<Discount>,
  ) { }
  // function to create Discount
  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    let createdDiscount = new this.chargeModel(createDiscountDto);
    let discount: Discount | undefined;
    try {
      discount = await createdDiscount.save();
      if (discount) {
        return discount;
      } else {
        throw new HttpException(
          'Error occured, cannot update discount',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
  //function to get All discounts
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

  // function to find one discount with id
  async findOne(id: String): Promise<Discount> {
    let options = {} as any;
    options.deleted = false;

    let discount = this.chargeModel.findById(id, options);
    const doesDiscountExit = this.chargeModel.exists({ _id: id,options });

    return doesDiscountExit
      .then(async (result) => {
        if (!result)
          throw new HttpException(
            `could not find discount with id ${id}`,
            HttpStatus.NOT_FOUND,
          );

        return discount;
      })
      .catch((error) => {
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      });
  }
  // function to update one discount
  async update(
    id: string,
    updateDiscountDto: UpdateDiscountDto,
  ): Promise<Discount | undefined> {

    // Retrieve the existing discount from the database
    const existingBusiness = await this.chargeModel.findById(id).exec();

    if (!existingBusiness) {
      // Handle the case where the discount with the provided ID does not exist
      throw new HttpException('Discount not found', HttpStatus.NOT_FOUND);
    }
    const fields: UpdateDiscountDto = {};
    for (const key in updateDiscountDto) {
      if (typeof updateDiscountDto[key] !== 'undefined') {
        fields[key] = updateDiscountDto[key];
      }
    }

    updateDiscountDto = fields;

    if (Object.keys(updateDiscountDto).length > 0) {
      let discount: Discount | null = await this.chargeModel.findById(id);

      if (discount) {
        discount = await this.chargeModel.findByIdAndUpdate(id, updateDiscountDto, { new: true }).exec();
        return discount;
      } else {
        throw new HttpException(`Could not find discount with id ${id}`, HttpStatus.NOT_FOUND);
      }
    } else {
      // Throw an error or return a response to indicate no updates were made
      throw new HttpException('No fields to update.', HttpStatus.BAD_REQUEST);
    }
  }

  // soft delete discount record by id ( set deleted to true and deleted_at to date now )
  async remove(id: string): Promise<Discount | undefined> {
    const discount = await this.chargeModel.findById(id);
    if (!discount) {
      throw new HttpException(
        `Could not find discount with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft delete by setting deleted to true
    discount.deleted = true;
    discount.deleted_at = new Date()
    await discount.save();
    return discount;
  }

  // restore discount deleted with soft delete
  async restore(id: string): Promise<Discount | undefined> {
    const discount = await this.chargeModel.findById(id);
    if (!discount) {
      throw new HttpException(
        `Could not find discount with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the soft restore by setting isDeleted to false
    discount.deleted = false;
    await discount.save();
    return discount;
  }

  // permanently delete discount
  async permaRemove(id: string): Promise<Discount | undefined> {
    const discount = await this.chargeModel.findById(id);
    if (!discount) {
      throw new HttpException(
        `Could not find discount with id ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    // delete the discount
    await this.chargeModel.deleteOne({ _id: id });
    return discount;
  }
  // function to bulk delete discounts
  async bulkRemove(ids: string[]): Promise<Discount[]> {
    const objectIds = ids.map(id => new Types.ObjectId(id))
    const discounts = await this.chargeModel.find({ _id: { $in: objectIds } });
    if (!discounts || discounts.length === 0) {
      throw new HttpException(
        `could not find discounts with ids ${ids.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return Promise.all(discounts.map(async (discount) => {
      await this.remove(discount._id)
      return discount;
    }));
  }

  async checkDiscount(code: string): Promise<object> {
    const discount = await this.chargeModel.findOne({ code }).exec();
    
    if (!discount) {
      return {
        message : 'DISCOUNT_NOT_FOUND'
      }
    }

    if (discount.status === 'ACTIVE') {
      return {
        message : 'VALID_DISCOUNT',        
      }
    } else if (discount.status === 'INACTIVE') {
      return {
        message : 'INVALID_DISCOUNT',
      }
    } else {
      return {
        message : 'DISCOUNT_NOT_FOUND',
      }
    }
  }
}
