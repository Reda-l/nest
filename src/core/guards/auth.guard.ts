
import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {

        if (!user) {
            throw new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED)
        } else
            // You can throw an exception based on either "info" or "err" arguments
            if (err) {
                throw err || new UnauthorizedException();
            }
        return user;
    }
}
