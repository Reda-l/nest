import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';

@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}


  // @UseGuards(AuthJwtAuthGuard)
  @Post()
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(createDiscountDto);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.discountService.findAll(query);
  }
  // @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discountService.findOne(id);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.discountService.restore(id);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiscountDto: UpdateDiscountDto) {
    return this.discountService.update(id, updateDiscountDto);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discountService.remove(id);
  }

  @Get('check/:code')
  async checkDiscount(@Param('code') code: string): Promise<object> {
    try {
      const message = await this.discountService.checkDiscount(code);
      return message;
    } catch (error) {
      return error.message;
    }
  }
}
