import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, IsUrl } from "class-validator";

export class CreateServiceDto {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty()
    @IsString()
    slug?: string;

    @ApiProperty()
    @IsString()
    @IsUrl()
    image: string;
}
