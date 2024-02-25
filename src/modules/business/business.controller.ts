import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { Request as ReqOptions } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, Roles } from 'src/core/shared/shared.enum';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Business } from 'src/core/types/interfaces/business.interface';
import { uploadFirebaseFile } from 'src/core/shared/firebaseUpload';

@Controller('settings')
@ApiTags('Business')
@ApiBearerAuth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) { }

  @UseGuards(AuthJwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin, Role.Admin)
  @Post()
  @UseInterceptors(
    FileInterceptor('logo')
  )
  async create(@Body() createBusinessDto: CreateBusinessDto, @UploadedFile() file) {
    // Check if file is uploaded
    if (file) {
      // Process file upload (assuming uploadFirebaseFile is a function defined somewhere)
      const imageUrl = await uploadFirebaseFile(file, 'logos');
      createBusinessDto.logo = imageUrl;
    }
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  async getSettings() {
    return await this.businessService.getSettings();
  }

  
}
