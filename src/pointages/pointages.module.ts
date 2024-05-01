import { Module } from '@nestjs/common';
import { PointagesService } from './pointages.service';
import { PointagesController } from './pointages.controller';
import { PointageSchema } from './entities/pointage.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/modules/users/users.module';
import { SalarySchema } from 'src/modules/salary/entities/salary.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Pointage', schema: PointageSchema }]),
    UsersModule
  ],
  controllers: [PointagesController],
  providers: [PointagesService],
  exports: [PointagesService],
})
export class PointagesModule {}
