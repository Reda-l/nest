import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';
import { Reflector } from '@nestjs/core';
// import { UsersService } from 'src/main/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector, //private userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    if (request?.user) {
      const { id, role } = request.user;
      // const user = await this.userService.findOne(id)
      if (roles?.includes(role)) return true;
      throw new HttpException(
        `only these roles are allowed ${roles}`,
        HttpStatus.FORBIDDEN,
      );
    }
    return false;
  }
}
