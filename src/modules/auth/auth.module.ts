import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtAccessStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async function (configService: ConfigService) {
        return { secret: configService.get<string>('API.token_secret'), }
      },
      inject: [ConfigService],
    }),
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService]
})
export class AuthModule { }
