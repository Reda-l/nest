import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Saving } from 'src/core/types/interfaces/saving.interface';
import { Model } from 'mongoose';
import { ActionsService } from '../actions/actions.service';

@Injectable()
export class SavingService {
  constructor(
    @InjectModel('Saving') private readonly savingModel: Model<Saving>,
    private readonly actionService: ActionsService, // Inject ActionService to track transactions
  ) {}

  // Create a new saving record with an initial balance (only called once)
  async createInitialSaving(): Promise<Saving> {
    const existingSaving = await this.savingModel.findOne().exec();
    if (existingSaving) {
      throw new HttpException('Saving record already exists', HttpStatus.BAD_REQUEST);
    }

    const saving = new this.savingModel({ balance: 0 }); // Initial balance can be set to any value
    await saving.save();

    return saving;
  }

  // Get the current balance
  async getBalance(): Promise<Saving> {
    const saving = await this.savingModel.findOne().exec();
    if (!saving) {
      throw new HttpException('Saving record not found', HttpStatus.NOT_FOUND);
    }
    return saving;
  }

  // Add money to the balance
  async addMoney(amount: number, userId: string): Promise<Saving> {
    console.log("🚀 ~ SavingService ~ addMoney ~ userId:", userId)
    if (amount <= 0) {
      throw new HttpException('Amount to add must be greater than zero', HttpStatus.BAD_REQUEST);
    }

    let saving = await this.savingModel.findOne().exec();
    if (!saving) {
      saving = new this.savingModel({ balance: 0 }); // Create a new saving record if none exists
    }

    // Update the balance
    saving.balance += amount;
    await saving.save();

    // Track the action (add money)
    await this.actionService.create({
      type: 'add_money',
      module: 'saving',
      entity: { amount, userId },
      user: userId,
    });

    return saving;
  }

  // Deduct money from the balance
  async deductMoney(amount: number, userId: string): Promise<Saving> {
    if (amount <= 0) {
      throw new HttpException('Amount to deduct must be greater than zero', HttpStatus.BAD_REQUEST);
    }

    let saving = await this.savingModel.findOne().exec();
    if (!saving) {
      throw new HttpException('Saving record not found', HttpStatus.NOT_FOUND);
    }

    if (saving.balance < amount) {
      throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST);
    }

    // Update the balance
    saving.balance -= amount;
    await saving.save();

    // Track the action (deduct money)
    await this.actionService.create({
      type: 'deduct_money',
      module: 'saving',
      entity: { amount, userId },
      user: userId,
    });

    return saving;
  }
}
