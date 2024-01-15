import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './modules/services/services.module';
import { ChargesModule } from './modules/charges/charges.module';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.MONGODB_URI_DEV, {
        connectionFactory: (connection) => {
          connection.plugin(require('mongoose-delete'), { deletedAt: true });
          return connection;
        }
      }),
    UsersModule,
    AuthModule,
    AppointmentsModule,
    ServicesModule,
    ChargesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

