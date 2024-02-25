import { Module } from '@nestjs/common';
import { PointagesService } from './pointages.service';
import { PointagesController } from './pointages.controller';
import { PointageSchema } from './entities/pointage.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Pointage', schema: PointageSchema }]),
  ],
  controllers: [PointagesController],
  providers: [PointagesService],
  exports: [PointagesService],
})
export class PointagesModule {}
