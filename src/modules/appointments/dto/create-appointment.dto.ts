import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsObject, IsArray, IsString, IsNumber, ValidateNested } from "class-validator";

class ServiceDto {
    @ApiProperty()
    @IsString()
    _id: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsString()
    image: string;

    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    time: number;

    @ApiProperty()
    @IsArray()
    @IsString({ each: true })
    description: string[];
}
class GenderDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    name: string;
}

class ReservationDto {
    @ApiProperty()
    @ValidateNested()
    @Type(() => GenderDto)
    gender: GenderDto;

    @ApiProperty({ type: [ServiceDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServiceDto)
    services: ServiceDto[];

    @ApiProperty()
    @IsOptional()
    @IsString()
    fullname?: string;
}
// DTO for appointment creation
export class CreateAppointmentDto {
    @ApiProperty()
    @IsOptional()
    date: Date;
    @ApiProperty()
    @IsOptional()
    time: string;
    @ApiProperty()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReservationDto)
    reservations?: ReservationDto[];
    @ApiProperty()
    @IsOptional()
    @IsObject()
    bookingPersonDetails?: any;
    @ApiProperty()
    @IsOptional()
    updatedBy?: string; // Assuming updatedBy is a string representing the user ID
    @ApiProperty()
    @IsOptional()
    status?: string; // Ensure the status field adheres to the provided options
    @ApiProperty()
    @IsOptional()
    deposit: Number;
    @ApiProperty()
    @IsOptional()
    commission: any;
}
