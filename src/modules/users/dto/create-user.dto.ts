import {
    IsString,
    IsOptional,
    IsDate,
    IsEmail,
    IsEnum,
    IsBoolean,
    IsObject,
    IsArray,
} from 'class-validator';
// import { GENDER_OPTIONS, STATUS_OPTIONS } from 'src/core/shared/shared.enum';
import { User } from 'src/core/types/interfaces/user.interface';
import { ApiProperty } from '@nestjs/swagger';
import { GENDER_OPTIONS, STATUS_OPTIONS } from 'src/core/shared/shared.enum';
export class CreateUserDto {

    @ApiProperty()
    @IsString()
    firstname: string;
    @ApiProperty()
    @IsString()
    lastname?: string;


    @ApiProperty()
    @IsOptional()
    DOB?: Date;

    @ApiProperty()
    @IsOptional() // auto-generate if not provided
    @IsString()
    username?: string;

    @ApiProperty()
    @IsEmail()
    email?: string;

    @ApiProperty()
    @IsOptional() // auto-generate if not provided
    @IsString()
    password?: string;


    @ApiProperty()
    @IsOptional()
    @IsEnum(GENDER_OPTIONS)
    gender?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    profileCompleted?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isGeneratedPassword?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    emailVerified?: boolean;

    @ApiProperty()
    @IsOptional()
    // @IsEnum(STATUS_OPTIONS)
    status?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    internalComments?: string;

    @ApiProperty()
    @IsOptional()
    lastLoginAt?: Date;

}

export class UserRO {
    data: User[];
    count: number;
    total: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
    page: number;
    pageCount: number;
}
