import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';

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
        user: {
          _id: user._id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          imageUrl: user.imageUrl,
          phoneNumber : user.phoneNumber,
          lastLoginAt: user.lastLoginAt
        },
        accessToken: token,
      }
      return userRO;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(AuthJwtAuthGuard)
  @Get('me')
  async findMe(@Request() req) {
    return {
      _id: req.user._id,
      username: req.user.username,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.email,
      imageUrl: req.user.imageUrl,
      lastLoginAt: req.user.lastLoginAt
    }
  }

  @UseGuards(AuthJwtAuthGuard)
  @Post('refresh-token')
  async refreshToken(@Request() req) {
    const payload = {
      username: req.user.username,
      role: req.user.ROLE,
    };
    // Generate and return a new access token
    const accessToken = await this.authService.signPayload(payload);
    return { accessToken };
  }
}
