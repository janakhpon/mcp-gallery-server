import { Injectable, Logger } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { FindImagesDto, ImagesResponse } from './dto/find-images.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue/queue.service';
import { RedisService } from '../shared/redis/redis.service';
import { S3Service } from '../shared/s3/s3.service';
import { NotificationsService } from '../shared/notifications/notifications.service';
import { Image } from '@prisma/client';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
    private readonly s3: S3Service,
    private readonly notifications: NotificationsService,
  ) { }

  async create(
    createImageDto: CreateImageDto & {
      originalName: string;
      mimeType: string;
      size: number;
    },
    buffer?: Buffer,
  ): Promise<Image> {
    const bucket = process.env.S3_BUCKET ?? 'image-gallery';
    const tempKey = `original/${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (buffer) {
      this.logger.log(
        `Uploading original to s3://${bucket}/${tempKey}, size: ${buffer.length} bytes`,
      );
      const result = await this.s3.uploadObject({
        bucket,
        key: tempKey,
        body: buffer,
        contentType: createImageDto.mimeType,
      });
      this.logger.log(`Original uploaded successfully: ${result.url}`);
    }

    const image = await this.prisma.image.create({
      data: {
        title: createImageDto.title,
        description: createImageDto.description,
        originalName: createImageDto.originalName,
        mimeType: createImageDto.mimeType,
        size: createImageDto.size,
        status: 'PENDING',
        s3Key: buffer ? tempKey : undefined,
      },
    });

    this.logger.log(`Image ${image.id} created, enqueuing processing job`);
    await this.queue.enqueueImageProcessing(image.id);

    // Send upload notification
    await this.notifications.notifyImageUploaded(image.id, image.title || 'Untitled');

    const client = this.redis.getClient();
    // Clear all image-related cache keys
    const keys = await client.keys('images:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return image;
  }

  async findAll(params: FindImagesDto = {}): Promise<ImagesResponse> {
    const { page = 1, limit = 12, status, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `images:${JSON.stringify({ page, limit, status, search })}`;
    const client = this.redis.getClient();

    try {
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached) as ImagesResponse;

      const [total, images] = await Promise.all([
        this.prisma.image.count({ where }),
        this.prisma.image.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const result: ImagesResponse = {
        images,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      await client.set(cacheKey, JSON.stringify(result), 'EX', 60);
      return result;
    } catch (error) {
      this.logger.error('Error in findAll:', error);
      // Fallback if Redis fails but DB works
      const total = await this.prisma.image.count({ where });
      const images = await this.prisma.image.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
      return {
        images,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  }


  async findOne(id: string): Promise<Image | null> {
    const key = `images:${id}`;
    const client = this.redis.getClient();
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached) as Image;

    const data = await this.prisma.image.findUnique({ where: { id } });
    if (data) await client.set(key, JSON.stringify(data), 'EX', 300);
    return data;
  }

  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    const updated = await this.prisma.image.update({
      where: { id },
      data: updateImageDto,
    });

    const client = this.redis.getClient();
    // Clear all image-related cache keys
    const keys = await client.keys('images:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return updated;
  }

  async remove(id: string): Promise<Image> {
    const deleted = await this.prisma.image.delete({ where: { id } });

    // Send delete notification
    await this.notifications.notifyImageDeleted(deleted.id, deleted.title || 'Untitled');

    const client = this.redis.getClient();
    // Clear all image-related cache keys
    const keys = await client.keys('images:*');
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return deleted;
  }

  async getDownloadUrl(id: string): Promise<{ downloadUrl: string; expiresIn: number }> {
    const image = await this.findOne(id);
    if (!image || !image.s3Key) {
      throw new Error('Image not found or not yet processed');
    }

    const bucket = process.env.S3_BUCKET ?? 'image-gallery';
    const url = await this.s3.getSignedUrl(bucket, image.s3Key, 3600);

    return {
      downloadUrl: url,
      expiresIn: 3600, // 1 hour
    };
  }

  async getFileStream(id: string): Promise<{ buffer: Buffer; contentType: string }> {
    const image = await this.findOne(id);
    if (!image || !image.s3Key) {
      throw new Error('Image not found or not yet processed');
    }

    const bucket = process.env.S3_BUCKET ?? 'image-gallery';
    const buffer = await this.s3.getObjectBuffer(bucket, image.s3Key);

    return {
      buffer,
      contentType: image.mimeType,
    };
  }
}
