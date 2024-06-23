import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthJwtAuthGuard } from 'src/core/guards/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private userService: UsersService) { }

  @Post('login')
  async login(@Request() req, @Body() userDTO: CreateAuthDto) {
    try {
      const user = await this.userService.findByLogin(userDTO) as any;
      console.log("🚀 ~ AuthController ~ login ~ user:", user)
      if (!user || user.status === 'REJECTED') {
        throw new HttpException('User account is disabled, please contact your administration or your lender', HttpStatus.UNAUTHORIZED);
      }

      const payload = {
        id: user._id,
        role: user.ROLE,
      };

      await this.userService.update(user._id, {
        lastLoginAt: new Date(),
      });

      const token = await this.authService.signPayload(payload);
      console.log("🚀 ~ AuthController ~ login ~ token:", token)
      const userRO = {
        user: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          email: user.email,
          picture: user.picture || null,
          phoneNumber : user.phoneNumber,
          lastLoginAt: user.lastLoginAt
        },
        accessToken: token,
      }
      console.log("🚀 ~ AuthController ~ login ~ userRO:", userRO)
      return userRO;
    } catch (error) {
      console.log("🚀 ~ AuthController ~ login ~ error:", error)
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(AuthJwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async findMe(@Request() req) {
    return {
      _id: req.user._id,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.email,
      picture: req.user.picture,
      lastLoginAt: req.user.lastLoginAt
    }
  }

  @UseGuards(AuthJwtAuthGuard)
  @ApiBearerAuth()
  @Post('refresh-token')
  async refreshToken(@Request() req) {
    const payload = {
      email: req.user.email,
      role: req.user.ROLE,
    };
    // Generate and return a new access token
    const accessToken = await this.authService.signPayload(payload);
    return { accessToken };
  }
}
