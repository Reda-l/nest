import { PartialType } from '@nestjs/swagger';
import { CreatePointageDto } from './create-pointage.dto';

export class UpdatePointageDto extends PartialType(CreatePointageDto) {}
