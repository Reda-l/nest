import { Controller, Get, Post, Body,Req,Request, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PointagesService } from './pointages.service';
import { CreatePointageDto } from './dto/create-pointage.dto';
import { UpdatePointageDto } from './dto/update-pointage.dto';
import { Request as ReqOptions } from 'express';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';

@Controller('pointages')
export class PointagesController {
  constructor(private readonly pointagesService: PointagesService) {}

  @Post()
  create(@Body() createPointageDto: CreatePointageDto) {
    return this.pointagesService.create(createPointageDto);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.pointagesService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pointagesService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get('user/:userId')
  async getPointageByUserId(@Param('userId') userId: string,@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.pointagesService.getPointageByUserId(userId,query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePointageDto: UpdatePointageDto) {
    return this.pointagesService.update(+id, updatePointageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pointagesService.remove(+id);
  }
}
