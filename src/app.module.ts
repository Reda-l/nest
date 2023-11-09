import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://spa:mazraoui1996@spa.dbqrkgz.mongodb.net/?retryWrites=true&w=majority', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-delete'), { deletedAt: true });
        return connection;
      }
    }),
    UsersModule,
    AuthModule,
    AppointmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
