import { Test, TestingModule } from '@nestjs/testing';
import { PointagesController } from './pointages.controller';
import { PointagesService } from './pointages.service';

describe('PointagesController', () => {
  let controller: PointagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointagesController],
      providers: [PointagesService],
    }).compile();

    controller = module.get<PointagesController>(PointagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
