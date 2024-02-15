import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsSchema } from './entities/action.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Action", schema: ActionsSchema }
    ]),
  ],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule { }
