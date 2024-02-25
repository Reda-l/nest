import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from 'src/core/types/interfaces/business.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { uploadFirebaseFile } from 'src/core/shared/firebaseUpload';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel('Business') public readonly businessModel: Model<Business>,
  ) { }
  // function to create Business
  async create(createBusinessDto: CreateBusinessDto): Promise<Business> {
    // Check if settings document already exists
    const existingSettings = await this.businessModel.findOne().exec();

    if (existingSettings) {
      // If settings exist, update it with new data
      return await this.businessModel.findByIdAndUpdate(existingSettings._id, createBusinessDto, { new: true }).exec();
    } else {
      // If no settings exist, create a new document
      const settings = new this.businessModel(createBusinessDto);
      return await settings.save();
    }
  }

  async getSettings(): Promise<Business> {
    const settings = await this.businessModel.findOne().exec();
    if (!settings) {
      throw new NotFoundException('Settings not found. Please provide settings.');
    }
    return settings
  }
 
 
 
  
  

  
  
  
}
