import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue/queue.service';
import { RedisService } from '../shared/redis/redis.service';
import { S3Service } from '../shared/s3/s3.service';

describe('ImagesService', () => {
  let service: ImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: PrismaService, useValue: { image: { create: jest.fn() } } },
        { provide: QueueService, useValue: { enqueueImageProcessing: jest.fn() } },
        { provide: RedisService, useValue: { getClient: () => ({ del: jest.fn(), get: jest.fn(), set: jest.fn() }) } },
        { provide: S3Service, useValue: { uploadObject: jest.fn() } },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates image and enqueues job', async () => {
    const prisma = (await Test.createTestingModule({}).compile()).get(PrismaService, { strict: false });
    const queue = (await Test.createTestingModule({}).compile()).get(QueueService, { strict: false });
    // Using service's injected mocks instead
    const created = await (service as any).prisma.image.create.mockResolvedValue({ id: 'img1' });
    await service.create({ originalName: 'a.jpg', mimeType: 'image/jpeg', size: 10 }, Buffer.from('x'));
    expect((service as any).prisma.image.create).toHaveBeenCalled();
    expect((service as any).queue.enqueueImageProcessing).toHaveBeenCalledWith('img1');
  });
});
