import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
// bull-board v1 API (matches package.json)
import { router as bullBoardRouter, setQueues, BullAdapter } from 'bull-board';
import { VersioningType } from '@nestjs/common';
import { QueueService } from './jobs/queue/queue.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.use(
    pinoHttp({
      logger: pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' }),
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gallery API')
    .setDescription('Image gallery CRUD and processing API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const queueService = app.get(QueueService);
  setQueues([new BullAdapter(queueService.getQueue())]);
  app.use('/admin/queues', bullBoardRouter);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
