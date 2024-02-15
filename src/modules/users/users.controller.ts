import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Req, HttpCode, HttpException, HttpStatus, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request as ReqOptions, Response } from 'express';
import { AuthJwtAuthGuard } from '../../core/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles, Role } from 'src/core/shared/shared.enum';
import { ApiTags ,ApiBearerAuth} from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseInterceptors(
    FileInterceptor('imageUrl')
  )
  async create(@Body() createUserDto: CreateUserDto, @Request() request, @UploadedFile() file) {
    if (!createUserDto.password || createUserDto.password === undefined) {
      createUserDto.password = Math.random().toString(36).slice(-8);
      createUserDto.isGeneratedPassword = true;
    }
    const mongoUser = await this.usersService.create({ ...createUserDto, imageUrl: file ? file : createUserDto.imageUrl });

    return {
      user: mongoUser,
      password: createUserDto.password,
    };
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin) 
  @Get()
  findAll(@Request() request, @Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.usersService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('imageUrl')
  )
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file) {
    return this.usersService.update(id, { ...updateUserDto, imageUrl: file ? file : updateUserDto.imageUrl });
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: ReqOptions) {
    return this.usersService.remove(id, req.user);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Delete('permadelete/:id')
  permadelete(@Param('id') id: string) {
    return this.usersService.permaRemove(id);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Post('reset-password')
  resetpassword(@Body() body) {
    return this.usersService.resetPassword(body.email, body.password);
  }
  // Export users data
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Get('csv/export')
  async exportUsers(@Res() res: Response) {
    const filePath = await this.usersService.usersDataToCSV();
    res.download(filePath);
  }
  // bulk delete list of users ids
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Post('bulk-delete')
  bulkRemove(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    } return this.usersService.bulkRemove(ids);
  }
  // bulk validate users
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Post('bulk-validate')
  bulkValidate(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.validateUsers(ids);
  }
  // bulk reject list of users ids
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Post('bulk-reject')
  bulkReject(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new HttpException('No users provided', HttpStatus.BAD_REQUEST);
    } return this.usersService.bulkReject(ids);
  }

}
