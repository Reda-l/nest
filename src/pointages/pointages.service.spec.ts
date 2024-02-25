import { Test, TestingModule } from '@nestjs/testing';
import { PointagesService } from './pointages.service';

describe('PointagesService', () => {
  let service: PointagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointagesService],
    }).compile();

    service = module.get<PointagesService>(PointagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
