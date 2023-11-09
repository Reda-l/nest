import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Secrets
  readonly SECRET_KEY = this.configService.get<string>('API.token_secret');

  constructor(
    private userService: UsersService,
    private configService: ConfigService,
    private jwtService: JwtService
  ) { }

  async signPayload(payload) {
    const expirationTime = 60 * 60 * 6; // 6 hours in seconds
    // Sign the payload with a 6-hour expiration time
    return this.jwtService.sign(payload, { expiresIn: expirationTime });
  }

  async validateUser(payload) {
    return await this.userService.findByPayload(payload);
  }

}
