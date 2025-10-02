import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  NotificationsService,
  ImageNotification,
} from './notifications.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Subscribe to real-time image processing notifications via SSE',
  })
  streamNotifications(): Observable<MessageEvent> {
    return new Observable((observer) => {
      // Send initial connection confirmation
      observer.next({
        data: JSON.stringify({
          type: 'connection',
          message: 'Connected to notification stream',
          timestamp: new Date().toISOString(),
        }),
      } as MessageEvent);

      this.notificationsService.subscribe((notification: ImageNotification) => {
        observer.next({
          data: JSON.stringify(notification),
        } as MessageEvent);
      });
    });
  }
}
