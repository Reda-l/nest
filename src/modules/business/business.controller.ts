import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, Roles } from 'src/core/shared/shared.enum';
import { RolesGuard } from 'src/core/guards/roles.guard';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) { }


  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Post()
  @UseInterceptors(
    FileInterceptor('logo')
  )
  create(@Body() createBusinessDto: CreateBusinessDto, @UploadedFile() file) {
    return this.businessService.create({ ...createBusinessDto, logo: file ? file : undefined });
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.businessService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.businessService.restore(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('logo')
  )
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto, @UploadedFile() file) {
    return this.businessService.update(id, { ...updateBusinessDto, logo: file ? file : undefined });
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }
}
