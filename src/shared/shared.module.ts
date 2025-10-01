import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { S3Service } from './s3/s3.service';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsController } from './notifications/notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [RedisService, S3Service, NotificationsService],
  exports: [RedisService, S3Service, NotificationsService],
})
export class SharedModule {}
