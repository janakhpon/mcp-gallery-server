import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import sharp from 'sharp';
import { S3Service } from '../../shared/s3/s3.service';

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {
    this.queueService.getQueue().process(async (job) => {
      const { imageId } = job.data;
      await this.processImage(imageId);
    });
  }

  private async processImage(imageId: string): Promise<void> {
    const image = await this.prisma.image.findUnique({ where: { id: imageId } });
    if (!image) return;
    try {
      await this.prisma.image.update({ where: { id: imageId }, data: { status: 'PROCESSING' } });
      const bucket = process.env.S3_BUCKET ?? 'image-gallery';
      const key = image.s3Key!;
      const original = await this.s3.getObjectBuffer(bucket, key);
      const processed = await sharp(original).resize(1280).jpeg({ mozjpeg: true }).toBuffer();
      const processedKey = `processed/${imageId}.jpg`;
      const uploaded = await this.s3.uploadObject({
        bucket,
        key: processedKey,
        body: processed,
        contentType: 'image/jpeg',
      });
      const meta = await sharp(processed).metadata();
      await this.prisma.image.update({
        where: { id: imageId },
        data: {
          status: 'READY',
          s3Key: uploaded.key,
          s3Url: uploaded.url,
          width: meta.width ?? null,
          height: meta.height ?? null,
        },
      });
    } catch (err) {
      this.logger.error('Processing failed', err as Error);
      await this.prisma.image.update({ where: { id: imageId }, data: { status: 'FAILED' } });
    }
  }
}

 
