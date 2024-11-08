import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SavingService } from './savings.service';
import { CreateSavingDto } from './dto/create-saving.dto';
import { UpdateSavingDto } from './dto/update-saving.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';

@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingService) {}

  // Endpoint to create the initial saving record
  @Post('create')
  async createInitialSaving() {
    return await this.savingsService.createInitialSaving();
  }

  // Endpoint to get the current balance
  @UseGuards(AuthJwtAuthGuard)
  @Get('balance')
  async getBalance() {
    return await this.savingsService.getBalance();
  }

  // Endpoint to add money to the balance
  @UseGuards(AuthJwtAuthGuard)
  @Post('add')
  async addMoney(
    @Body('amount') amount: number,
    @Req() req,
    @Body('name') name?: string,
    @Body('reason') reason?: string,
    @Body('date') date?: Date,
  ) {
    const userId = req.user;
    return await this.savingsService.addMoney(
      amount,
      userId,
      name,
      reason,
      date,
    );
  }

  // Endpoint to deduct money from the balance
  @UseGuards(AuthJwtAuthGuard)
  @Post('deduct')
  async deductMoney(
    @Body('amount') amount: number,
    @Req() req,
    @Body('name') name?: string,
    @Body('reason') reason?: string,
    @Body('date') date?: Date,
  ) {
    const userId = req.user;
    return await this.savingsService.deductMoney(
      amount,
      userId,
      name,
      reason,
      date,
    );
  }
}
