import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface ImageNotification {
  imageId: string;
  status: 'READY' | 'FAILED' | 'UPLOADED' | 'DELETED';
  title?: string;
  s3Url?: string;
  error?: string;
  timestamp: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly CHANNEL = 'image:notifications';

  constructor(private readonly redis: RedisService) { }

  /**
   * Publish notification when image processing completes
   */
  async notifyImageReady(
    notification: Omit<ImageNotification, 'timestamp'>,
  ): Promise<void> {
    const payload: ImageNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    const client = this.redis.getClient();
    const subscribers = await client.publish(
      this.CHANNEL,
      JSON.stringify(payload),
    );

    this.logger.log(
      `Published notification for image ${notification.imageId} (status: ${notification.status}) to ${subscribers} subscribers`,
    );
  }

  /**
   * Publish notification when image is uploaded
   */
  async notifyImageUploaded(
    imageId: string,
    title: string,
  ): Promise<void> {
    const payload: ImageNotification = {
      imageId,
      status: 'UPLOADED',
      title,
      timestamp: new Date().toISOString(),
    };

    const client = this.redis.getClient();
    const subscribers = await client.publish(
      this.CHANNEL,
      JSON.stringify(payload),
    );

    this.logger.log(
      `Published upload notification for image ${imageId} to ${subscribers} subscribers`,
    );
  }

  /**
   * Publish notification when image is deleted
   */
  async notifyImageDeleted(
    imageId: string,
    title: string,
  ): Promise<void> {
    const payload: ImageNotification = {
      imageId,
      status: 'DELETED',
      title,
      timestamp: new Date().toISOString(),
    };

    const client = this.redis.getClient();
    const subscribers = await client.publish(
      this.CHANNEL,
      JSON.stringify(payload),
    );

    this.logger.log(
      `Published delete notification for image ${imageId} to ${subscribers} subscribers`,
    );
  }

  /**
   * Subscribe to image notifications (for real-time clients like WebSocket/SSE)
   * Returns an unsubscribe function to clean up resources
   */
  subscribe(callback: (notification: ImageNotification) => void): () => void {
    const subscriber = this.redis.getClient().duplicate();

    subscriber.subscribe(this.CHANNEL, (err, count) => {
      if (err) {
        this.logger.error('Failed to subscribe', err);
      } else {
        this.logger.log(`Subscribed to ${count} channel(s)`);
      }
    });

    subscriber.on('message', (channel, message) => {
      try {
        const notification: ImageNotification = JSON.parse(message);
        callback(notification);
      } catch (err) {
        this.logger.error('Failed to parse notification', err);
      }
    });

    // Return cleanup function
    return () => {
      this.logger.log('Unsubscribing from notifications and closing client');
      subscriber.quit().catch((err) => {
        this.logger.error('Error closing Redis subscription client', err);
      });
    };
  }
}
