import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Role, Roles } from 'src/core/shared/shared.enum';
import { Request as ReqOptions } from 'express';

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Post()
  create(@Body() createSalaryDto: CreateSalaryDto) {
    return this.salaryService.create(createSalaryDto);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.salaryService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.salaryService.restore(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto) {
    return this.salaryService.update(id, updateSalaryDto);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salaryService.remove(id);
  }
}
