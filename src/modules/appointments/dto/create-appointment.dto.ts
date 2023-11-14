import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsObject, IsArray } from "class-validator";

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
    reservations?: any;
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
}
