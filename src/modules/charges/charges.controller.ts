import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';

@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) { }

  @UseGuards(AuthJwtAuthGuard)
  @Post()
  create(@Body() createChargeDto: CreateChargeDto) {
    return this.chargesService.create(createChargeDto);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Get("stats")
  getAllStats(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.getStats(query);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Get("top-stats")
  getTopPerformanceStats(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.getTopPerformanceStats(query);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargesService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.chargesService.restore(id);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChargeDto: UpdateChargeDto) {
    return this.chargesService.update(id, updateChargeDto);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargesService.remove(id);
  }
}
