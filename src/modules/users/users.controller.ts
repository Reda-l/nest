import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Req,
  HttpCode,
  HttpException,
  HttpStatus,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request as ReqOptions, Response } from 'express';
import { AuthJwtAuthGuard } from '../../core/guards/auth.guard';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles, Role } from 'src/core/shared/shared.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cinFront', maxCount: 1 },
      { name: 'cinBack', maxCount: 1 },
      { name: 'empreint', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      cinFront?: Express.Multer.File[];
      cinBack?: Express.Multer.File[];
      empreint?: Express.Multer.File[];
    },
    @Body() createUserDto: CreateUserDto,
  ) {
    // Call the service method to create user and pass the files
    const user = await this.usersService.create(createUserDto, files);

    // Remove the password field from the user object
    const { password, ...userWithoutPassword } = user;

    // Return response without the password field
    return {
      user: userWithoutPassword,
      message: 'User created successfully'
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
    FileFieldsInterceptor([
      { name: 'cinFront', maxCount: 1 },
      { name: 'cinBack', maxCount: 1 },
      { name: 'empreint', maxCount: 1 },
    ]),
  )
  update(
    @UploadedFiles()
    files: {
      cinFront?: Express.Multer.File[];
      cinBack?: Express.Multer.File[];
      empreint?: Express.Multer.File[];
    },
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    
  ) {
    console.log("🚀 ~ UsersController ~ id:", id)
    console.log("🚀 ~ UsersController ~ updateUserDto:", updateUserDto)
    
    console.log("🚀 ~ UsersController ~ files:", files)
    return this.usersService.update(id, updateUserDto, files);
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
    }
    return this.usersService.bulkRemove(ids);
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
    }
    return this.usersService.bulkReject(ids);
  }
}
