import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { Roles, Role } from 'src/core/shared/shared.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('charges')
@ApiTags('Charges')
@ApiBearerAuth()
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) { }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Post()
  @UseInterceptors(
    FileInterceptor('image')
  )
  create(@Body() createChargeDto: CreateChargeDto, @UploadedFile() file: Express.Multer.File) {
    return this.chargesService.create({ ...createChargeDto, image: file ? file : createChargeDto.image });
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Get()
  findAll(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.findAll(query);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Get("stats")
  getAllStats(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.getStats(query);
  }
  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Get("top-stats")
  getTopPerformanceStats(@Req() req: ReqOptions) {
    let query = req.query.s ? JSON.parse(req.query.s as string) : {};
    if (!query.filter) query.filter = {};
    return this.chargesService.getTopPerformanceStats(query);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargesService.findOne(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Get('/restore/:id')
  restoreAccount(@Param('id') id: string) {
    return this.chargesService.restore(id);
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image')
  )
  update(@Param('id') id: string, @Body() updateChargeDto: UpdateChargeDto, @UploadedFile() file: Express.Multer.File) {
    return this.chargesService.update(id, { ...updateChargeDto, image: file ? file : updateChargeDto.image });
  }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin, Role.Cassier)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargesService.remove(id);
  }
}
