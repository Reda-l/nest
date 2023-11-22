import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'sERTCqdz455ze2aezaecsdazpLxmyEqsdqsmKDqLETDpUrP6AlqlFeMGJsotkeazd5eaz8A6ZSDdqz9aT7STEqIoOVuCqLqYSq9za79za46CZEZDZAFEFEZnFm5J10UrBEtzSLOoK'
    });
  }

  async validate(payload: any) {
    // You might want to check if the token is still valid or if the user exists
    // Generate a new access token here
    return { userId: payload.sub, username: payload.username };
  }
}