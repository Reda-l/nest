import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { chargeSchema } from './entities/charge.entity';
import { appointmentSchema } from '../appointments/entities/appointment.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Charge", schema: chargeSchema },{ name: "Appointment", schema: appointmentSchema }
    ]),
    MulterModule.registerAsync({
      useFactory: () => ({
        storage: diskStorage({
          filename: (req, file, cb) => {
            const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('')
            cb(null, `${randomName}${extname(file.originalname)}`)
          }
        })
      }),
    }),
  ],
  controllers: [ChargesController],
  providers: [ChargesService],
})
export class ChargesModule {}
