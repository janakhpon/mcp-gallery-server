import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClient;

  constructor() {
    const url = process.env.REDIS_URL;
    if (url) {
      this.client = new Redis(url);
      return;
    }

    let host = process.env.REDIS_HOST ?? 'localhost';
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
    const isDocker =
      process.env.DOCKER_COMPOSE === 'true' || process.env.DOCKER === 'true';
    if (
      host === 'redis' &&
      !isDocker &&
      process.env.NODE_ENV !== 'production'
    ) {
      host = '127.0.0.1';
    }
    this.client = new Redis({ host, port });
  }

  getClient(): RedisClient {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
