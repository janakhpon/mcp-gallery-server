import { Injectable } from '@nestjs/common';
import Bull = require('bull');

export interface ImageJobPayload {
  imageId: string;
}

@Injectable()
export class QueueService {
  private readonly queue: Bull.Queue<ImageJobPayload>;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.queue = new Bull<ImageJobPayload>('image-processing', url);
      return;
    }
    let redisHost = process.env.REDIS_HOST ?? 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);
    const isDocker =
      process.env.DOCKER_COMPOSE === 'true' || process.env.DOCKER === 'true';
    if (
      redisHost === 'redis' &&
      !isDocker &&
      process.env.NODE_ENV !== 'production'
    ) {
      redisHost = '127.0.0.1';
    }
    this.queue = new Bull<ImageJobPayload>('image-processing', {
      redis: { host: redisHost, port: redisPort },
    });
  }

  async enqueueImageProcessing(imageId: string): Promise<void> {
    await this.queue.add(
      { imageId },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );
  }

  getQueue(): Bull.Queue<ImageJobPayload> {
    return this.queue;
  }
}
