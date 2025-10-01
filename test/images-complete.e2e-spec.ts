import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';

describe('Images Complete Flow E2E', () => {
  let app: INestApplication;
  let createdImageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply production configuration
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Image Upload & Processing Flow', () => {
    it('should upload image successfully', async () => {
      const filePath = path.join(__dirname, 'fixtures', 'test-actual.png');
      
      const res = await request(app.getHttpServer())
        .post('/api/v1/images')
        .field('title', 'E2E Test')
        .field('description', 'Full integration test')
        .attach('file', filePath)
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        title: 'E2E Test',
        status: 'PENDING',
        s3Key: expect.stringContaining('original/'),
      });

      createdImageId = res.body.id;
    });

    it('should get presigned download URL', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/images/${createdImageId}/download`)
        .expect(200);

      expect(res.body).toMatchObject({
        url: expect.stringContaining('X-Amz-Signature'),
        expiresIn: 3600,
      });
    });

    it('should cache list endpoint', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/api/v1/images').expect(200);
      const firstCall = Date.now() - start;

      const start2 = Date.now();
      await request(app.getHttpServer()).get('/api/v1/images').expect(200);
      const secondCall = Date.now() - start2;

      // Second call should be faster (from cache)
      expect(secondCall).toBeLessThan(firstCall);
    });
  });

  describe('Health & Monitoring Endpoints', () => {
    it('GET / - health check', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health - detailed health', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toHaveProperty('memory');
    });

    it('GET /metrics - Prometheus metrics', async () => {
      const res = await request(app.getHttpServer()).get('/metrics').expect(200);
      expect(res.text).toContain('process_cpu_user_seconds_total');
    });
  });
});

