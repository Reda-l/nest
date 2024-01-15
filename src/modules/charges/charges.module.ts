import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { chargeSchema } from './entities/charge.entity';
import { appointmentSchema } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Charge", schema: chargeSchema },{ name: "Appointment", schema: appointmentSchema }
    ]),
  ],
  controllers: [ChargesController],
  providers: [ChargesService],
})
export class ChargesModule {}
