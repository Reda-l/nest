import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}


  // @UseGuards(AuthJwtAuthGuard)
  @Post()
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.businessService.findAll(query);
  }
  // @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.businessService.restore(id);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(id, updateBusinessDto);
  }

  // @UseGuards(AuthJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }
}
