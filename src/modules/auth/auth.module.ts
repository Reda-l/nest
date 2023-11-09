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
    
    JwtModule.register({
      global: true,
      secret: 'c2qazeafezdzDEF8F8EZZOXIlcHPArhZwZgH159Aezcz7s0cq8Lqcd7bGcVluZ4ZFDSFGMMPDWW3zeFzez6w035cDdq9DvXHhQmDrJlYzWdlcu5WB6m9taTa5PMpKKyqvW8cXVmG7F4',
      signOptions: { expiresIn: '60s' },
    }),
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService]
})
export class AuthModule { }
