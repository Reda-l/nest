import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from './modules/services/services.module';
import { ChargesModule } from './modules/charges/charges.module';
import { BusinessModule } from './modules/business/business.module';
import { DiscountModule } from './modules/discount/discount.module';
import { ActionsModule } from './modules/actions/actions.module';
import * as dotenv from 'dotenv';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActionsInterceptor } from './core/interceptors/actions.interceptor';
import { PointagesModule } from './pointages/pointages.module';

// Load environment variables from .env file
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD
        : process.env.MONGODB_URI_DEV,
      {
        connectionFactory: (connection) => {
          connection.plugin(require('mongoose-delete'), { deletedAt: true });
          return connection;
        },
      },
    ),
    UsersModule,
    AuthModule,
    AppointmentsModule,
    ServicesModule,
    ChargesModule,
    BusinessModule,
    DiscountModule,
    ActionsModule,
    PointagesModule,
  ],
  controllers: [AppController],
  providers: [AppService,    {
    provide: APP_INTERCEPTOR,
    useClass: ActionsInterceptor,
  },],
})
export class AppModule {}
