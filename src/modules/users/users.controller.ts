import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Req, HttpCode, HttpException, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request as ReqOptions, Response } from 'express';
import { AuthJwtAuthGuard } from '../../core/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Request() request) {
    if (!createUserDto.password || createUserDto.password === undefined) {
      createUserDto.password = Math.random().toString(36).slice(-8);
      createUserDto.isGeneratedPassword = true;
    }
    const mongoUser = await this.usersService.create(createUserDto);

    return {
      user: mongoUser,
      password: createUserDto.password,
    };
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.usersService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Delete('permadelete/:id')
  permadelete(@Param('id') id: string) {
    return this.usersService.permaRemove(id);
  }
  @UseGuards(AuthJwtAuthGuard)
  @Post('reset-password')
  resetpassword(@Body() body) {
    return this.usersService.resetPassword(body.email, body.password);
  }
  // Export users data
  @UseGuards(AuthJwtAuthGuard)
  @Get('csv/export')
  async exportUsers(@Res() res: Response) {
    const filePath = await this.usersService.usersDataToCSV();
    res.download(filePath);
  }
  // bulk delete list of users ids
  @UseGuards(AuthJwtAuthGuard)
  @Post('bulk-delete')
  bulkRemove(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    } return this.usersService.bulkRemove(ids);
  }
  // bulk validate users
  @UseGuards(AuthJwtAuthGuard)
  @Post('bulk-validate')
  bulkValidate(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.validateUsers(ids);
  }
  // bulk reject list of users ids
  @UseGuards(AuthJwtAuthGuard)
  @Post('bulk-reject')
  bulkReject(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    } return this.usersService.bulkReject(ids);
  }

}
