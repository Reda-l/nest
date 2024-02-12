import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUrl } from "class-validator";

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
    @IsNumber()
    @IsNotEmpty()
    time: number;

    @ApiProperty()
    image: any;

    @ApiProperty()
    @IsString()
    type: string;
    
    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    description: string[];
}
