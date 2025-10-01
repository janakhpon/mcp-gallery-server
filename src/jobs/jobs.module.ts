import { Module } from '@nestjs/common';
import { QueueService } from './queue/queue.service';
import { ProcessorService } from './processor/processor.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [QueueService, ProcessorService, PrismaService],
  exports: [QueueService],
})
export class JobsModule {}
