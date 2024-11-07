import { Module } from '@nestjs/common';
import { SavingsController } from './savings.controller';
import { SavingService } from './savings.service';
import { SavingSchema } from './entities/saving.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Saving", schema: SavingSchema }
    ]),
    ActionsModule
  ],
  controllers: [SavingsController],
  providers: [SavingService],
})
export class SavingsModule {}
