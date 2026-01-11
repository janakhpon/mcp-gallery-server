// IMPORTANT: Datadog tracing must be imported FIRST
import './tracing';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { router as bullBoardRouter, setQueues, BullAdapter } from 'bull-board';
import { QueueService } from './jobs/queue/queue.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security & Logging
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable CSP in dev to avoid blocking external images/sources
    }),
  );
  app.use(
    pinoHttp({
      logger: pino({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      }),
    }),
  );

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Gallery API')
    .setDescription(
      'Image gallery with async processing and real-time notifications',
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.production.com', 'Production')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Bull Board Queue Monitoring
  const queueService = app.get(QueueService);
  setQueues([new BullAdapter(queueService.getQueue())]);
  app.use('/admin/queues', bullBoardRouter);

  // CORS (enable in production with proper origin)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);

  console.log(`\n🚀 Gallery API Started`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📚 API Docs:      http://localhost:${port}/api`);
  console.log(`📊 Queue Monitor: http://localhost:${port}/admin/queues`);
  console.log(`📈 Metrics:       http://localhost:${port}/metrics`);
  console.log(`💚 Health:        http://localhost:${port}/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Grafana:       http://localhost:3002 (admin/admin)`);
  console.log(`📈 Prometheus:    http://localhost:9090`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

bootstrap();
