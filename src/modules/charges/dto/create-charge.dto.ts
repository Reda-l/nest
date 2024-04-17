import { ApiProperty } from "@nestjs/swagger";

export class CreateChargeDto {
  @ApiProperty()
  image: any;
  date: any;
  name: string
  price: number
  reason: string
  _id: string
  responsable: string
  type: string
  created_at: Date
  updated_at: Date
}
