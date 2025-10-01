import { Injectable, Logger } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../jobs/queue/queue.service';
import { RedisService } from '../shared/redis/redis.service';
import { S3Service } from '../shared/s3/s3.service';
import { Image } from '@prisma/client';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
    private readonly s3: S3Service,
  ) {}

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

    const client = this.redis.getClient();
    await client.del('images:all');
    return image;
  }

  async findAll(): Promise<Image[]> {
    const key = 'images:all';
    const client = this.redis.getClient();
    const cached = await client.get(key);
    if (cached) return JSON.parse(cached) as Image[];
    
    const data = await this.prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
    });
    await client.set(key, JSON.stringify(data), 'EX', 60);
    return data;
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
    await client.del('images:all');
    await client.del(`images:${id}`);
    return updated;
  }

  async remove(id: string): Promise<Image> {
    const deleted = await this.prisma.image.delete({ where: { id } });
    
    const client = this.redis.getClient();
    await client.del('images:all');
    await client.del(`images:${id}`);
    return deleted;
  }

  async getDownloadUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const image = await this.findOne(id);
    if (!image || !image.s3Key) {
      throw new Error('Image not found or not yet processed');
    }

    const bucket = process.env.S3_BUCKET ?? 'image-gallery';
    const url = await this.s3.getSignedUrl(bucket, image.s3Key, 3600);
    
    return {
      url,
      expiresIn: 3600, // 1 hour
    };
  }
}
