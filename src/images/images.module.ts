import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JobsModule } from '../jobs/jobs.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [JobsModule, SharedModule],
  controllers: [ImagesController],
  providers: [ImagesService, PrismaService],
  exports: [ImagesService],
})
export class ImagesModule {}
