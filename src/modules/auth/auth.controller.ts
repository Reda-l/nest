import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private userService: UsersService) { }

  @Post('login')
  async login(@Request() req, @Body() userDTO: any) {
    try {
      const user = await this.userService.findByLogin(userDTO) as any;

      if (!user || user.status === 'REJECTED') {
        throw new HttpException('User account is disabled, please contact your administration or your lender', HttpStatus.UNAUTHORIZED);
      }

      const payload = {
        username: user.username,
        role: user.ROLE,
      };

      await this.userService.update(user._id, {
        lastLoginAt: new Date(),
      });

      const token = await this.authService.signPayload(payload);
      const userRO = {
        user: user,
        accessToken: token,
      }
      return userRO;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
