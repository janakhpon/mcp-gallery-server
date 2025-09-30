import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImagesModule } from './images/images.module';
import { S3Service } from './shared/s3/s3.service';
import { QueueService } from './jobs/queue/queue.service';
import { ProcessorService } from './jobs/processor/processor.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './shared/redis/redis.service';
 

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ImagesModule],
  controllers: [AppController],
  providers: [AppService, S3Service, QueueService, ProcessorService, PrismaService, RedisService],
})
export class AppModule {}
