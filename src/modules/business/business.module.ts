import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessSchema } from './entities/business.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Business", schema: BusinessSchema }
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule { }
