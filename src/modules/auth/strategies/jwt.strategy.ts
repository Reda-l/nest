import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, VerifiedCallback } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";

type JwtPayload = {
    sub: string,
    email: string,
    iat: any
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'c2qazeafezdzDEF8F8EZZOXIlcHPArhZwZgH159Aezcz7s0cq8Lqcd7bGcVluZ4ZFDSFGMMPDWW3zeFzez6w035cDdq9DvXHhQmDrJlYzWdlcu5WB6m9taTa5PMpKKyqvW8cXVmG7F4',
        })
    }
    async validate(payload: JwtPayload, done: VerifiedCallback) {
        const user = await this.authService.validateUser(payload);
        return done(null, user, payload.iat);
    }
}
