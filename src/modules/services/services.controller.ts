import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Request as ReqOptions } from 'express';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(AuthJwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('image')
  )
  create(@Body() createServiceDto: CreateServiceDto, @UploadedFile() file : Express.Multer.File) {
    return this.servicesService.create({ ...createServiceDto, image: file ? file : undefined });
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.servicesService.findAll(query);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get('types')
  async getAllTypes(): Promise<string[]> {
    return await this.servicesService.getAllTypes();
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
  
  @UseGuards(AuthJwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image')
  )
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto, @UploadedFile() file : Express.Multer.File) {
    console.log("🚀 ~ ServicesController ~ update ~ file:", file)
    return this.servicesService.update(id, { ...updateServiceDto, image: file ? file : undefined });
  }
  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(+id);
  }
}
