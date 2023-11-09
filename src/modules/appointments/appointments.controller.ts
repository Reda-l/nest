import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Request, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Request as ReqOptions } from 'express';
import { EmailService } from 'src/core/shared/email.service';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService, private emailService: EmailService) { }

  @UseGuards(AuthJwtAuthGuard)
  @Post()
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @UseGuards(AuthJwtAuthGuard)
  @Post('send-email')
  async sendExampleEmail() {
    try {
      console.log('SEND EMAIL')
      await this.emailService.sendEmail('mazraoui.1996@gmail.com', 'Test Email');
      return { message: 'Email sent successfully' };
    } catch (error) {
      return { message: 'Failed to send email' };
    }
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(+id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(+id);
  }
}
