import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { serviceSchema } from './entities/service.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "Service", schema: serviceSchema },
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
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule { }
