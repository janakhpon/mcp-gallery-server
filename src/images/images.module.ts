import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../shared/s3/s3.service';
import { QueueService } from '../jobs/queue/queue.service';
import { RedisService } from '../shared/redis/redis.service';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService, PrismaService, S3Service, QueueService, RedisService],
})
export class ImagesModule {}
