import { Module } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SalarySchema } from './entities/salary.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Salary", schema: SalarySchema }
    ]),
    UsersModule
  ],
  controllers: [SalaryController],
  providers: [SalaryService],
})
export class SalaryModule {}
