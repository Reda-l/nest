import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Request, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Request as ReqOptions } from 'express';
import { EmailService } from 'src/core/shared/email.service';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles, Role } from 'src/core/shared/shared.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('appointments')
@ApiTags('Appointments')
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService, private emailService: EmailService) { }

  // @UseGuards(AuthJwtAuthGuard, RolesGuard)
  // @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Post('send-email')
  async sendExampleEmail() {
    try {
      console.log('SEND EMAIL')
      // await this.emailService.sendEmail('mazraoui.1996@gmail.com', 'Test Email');
      return { message: 'Email sent successfully' };
    } catch (error) {
      return { message: 'Failed to send email' };
    }
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get('commission')
  findAppointmentCommission(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.appointmentsService.getAppointmentCommision(query);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.appointmentsService.findAll(query);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.appointmentsService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto, @Request() request) {
    const authenticated = request.user
    return this.appointmentsService.update(id, updateAppointmentDto, authenticated);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin,Role.Mannager)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() request) {
    const authenticated = request.user
    return this.appointmentsService.remove(id, authenticated);
  }

  
}
