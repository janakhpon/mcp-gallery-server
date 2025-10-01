import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../shared/s3/s3.service';
import { NotificationsService } from '../../shared/notifications/notifications.service';

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly notifications: NotificationsService,
  ) {
    this.queueService.getQueue().process(async (job) => {
      const { imageId } = job.data;
      await this.processImage(imageId);
    });
  }

  private async processImage(imageId: string): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      this.logger.warn(`Image ${imageId} not found in database`);
      return;
    }

    if (!image.s3Key) {
      this.logger.error(`Image ${imageId} has no s3Key, cannot process`);
      await this.prisma.image.update({
        where: { id: imageId },
        data: { status: 'FAILED' },
      });
      return;
    }

    try {
      await this.prisma.image.update({
        where: { id: imageId },
        data: { status: 'PROCESSING' },
      });

      const bucket = process.env.S3_BUCKET ?? 'image-gallery';
      const key = image.s3Key;

      this.logger.log(`Processing image ${imageId}: s3://${bucket}/${key}`);

      // Build the S3 URL
      const endpoint = process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000';
      const s3Url = `${endpoint}/${bucket}/${key}`;

      this.logger.log(`Setting image ${imageId} as READY with URL: ${s3Url}`);

      const updated = await this.prisma.image.update({
        where: { id: imageId },
        data: {
          status: 'READY',
          s3Url,
        },
      });

      this.logger.log(`Image ${imageId} processed successfully`);

      // Broadcast notification
      await this.notifications.notifyImageReady({
        imageId: updated.id,
        status: 'READY',
        title: updated.title ?? undefined,
        s3Url: updated.s3Url ?? undefined,
      });
    } catch (err: any) {
      this.logger.error(
        `Processing failed for image ${imageId}: ${err.message}`,
        err.stack,
      );
      await this.prisma.image.update({
        where: { id: imageId },
        data: { status: 'FAILED' },
      });

      // Broadcast failure notification
      await this.notifications.notifyImageReady({
        imageId,
        status: 'FAILED',
        error: err.message,
      });
    }
  }
}
