import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Images (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/images (POST) uploads an image', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'tiny.jpg');
    const exists = fs.existsSync(filePath);
    const req = request(app.getHttpServer())
      .post('/api/v1/images')
      .field('title', 'Tiny')
      .attach(
        'file',
        exists ? filePath : Buffer.from([0xff, 0xd8, 0xff]),
        'tiny.jpg',
      );

    const res = await req.expect(201);
    expect(res.body.id).toBeDefined();
  });

  it('/api/v1/images (GET) lists images', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/images')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
