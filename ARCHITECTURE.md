# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  (React/Vue/Mobile App - Frontend Application)              │
└────┬─────────────────────────────────────────────┬──────────┘
     │                                             │
     │ REST API                                    │ SSE Stream
     │ /api/v1/images                              │ /api/v1/notifications/stream
     │                                             │
┌────▼─────────────────────────────────────────────▼──────────┐
│                    NESTJS API SERVER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Images     │  │    Jobs      │  │   Shared     │      │
│  │   Module     │  │   Module     │  │   Module     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│    Controller        Queue/Worker      Redis/S3/Notify      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                   INFRASTRUCTURE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │   MinIO/S3   │      │
│  │   (Prisma)   │  │  Cache+Queue │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Datadog Agent (Monitoring)              │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Module Hierarchy

```
AppModule
├── ConfigModule (Global)
├── SharedModule (@Global)
│   ├── RedisService (Cache + Pub/Sub)
│   ├── S3Service (Object Storage)
│   ├── NotificationsService (Event Broadcasting)
│   └── NotificationsController (SSE endpoint)
├── JobsModule
│   ├── QueueService (Bull Producer)
│   └── ProcessorService (Bull Consumer)
└── ImagesModule
    ├── ImagesController (REST CRUD)
    └── ImagesService (Business Logic)
```

## Data Flow

### Upload Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/v1/images
     ▼
┌──────────────────┐
│ ImagesController │
└────┬─────────────┘
     │ validate file + DTO
     ▼
┌──────────────────┐
│  ImagesService   │──────┐
└────┬─────────────┘      │
     │                    │
     │ 1. Upload to S3    │ 2. Save metadata
     ▼                    ▼
┌──────────┐      ┌────────────────┐
│ S3Service│      │ PrismaService  │
└──────────┘      └────────────────┘
     │                    │
     │                    │ status: PENDING
     │                    ▼
     │            ┌────────────────┐
     │            │  PostgreSQL DB │
     │            └────────────────┘
     │
     └──────────────┐
                    │ 3. Enqueue job
                    ▼
            ┌───────────────┐
            │  QueueService │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │   Bull Queue  │
            │  (Redis-based)│
            └───────────────┘
```

### Processing Flow
```
┌───────────────┐
│   Bull Queue  │
└───────┬───────┘
        │ job picked up
        ▼
┌──────────────────────┐
│  ProcessorService    │
└───────┬──────────────┘
        │
        │ 1. Update status: PROCESSING
        ▼
┌────────────────┐
│  PostgreSQL    │
└────────────────┘
        │
        │ 2. Build S3 URL
        ▼
┌────────────────┐
│  Update DB:    │
│  - s3Url       │
│  - status:READY│
└───────┬────────┘
        │
        │ 3. Publish notification
        ▼
┌──────────────────────┐
│ NotificationsService │
└───────┬──────────────┘
        │
        │ Redis pub/sub
        ▼
┌──────────────────────┐
│   All SSE Clients    │
│  (Real-time update)  │
└──────────────────────┘
```

## Design Patterns

### 1. **Module Pattern**
- Feature modules (ImagesModule, JobsModule)
- Global shared services (@Global SharedModule)
- Dependency injection via constructor

### 2. **Repository Pattern**
- PrismaService acts as repository
- Services encapsulate business logic
- Controllers handle HTTP

### 3. **Producer/Consumer Pattern**
- QueueService (Producer) - creates jobs
- ProcessorService (Consumer) - processes jobs
- Decoupled, scalable async processing

### 4. **Cache-Aside Pattern**
- Check cache first
- On miss, fetch from DB and populate cache
- Invalidate on writes

### 5. **Pub/Sub Pattern**
- NotificationsService publishes events
- Multiple subscribers can listen
- Real-time updates via SSE

## Scalability Strategies

### Horizontal Scaling (Recommended)

```
Load Balancer
    │
    ├─── API Instance 1 (Stateless)
    ├─── API Instance 2 (Stateless)
    └─── API Instance 3 (Stateless)
           │
           └─── Shared State
                ├── PostgreSQL (Single Writer, Multiple Readers)
                ├── Redis (Cluster Mode)
                └── S3 (Infinite Scale)
```

**Benefits:**
- Add/remove instances dynamically
- No session affinity needed (stateless)
- Queue workers scale independently

### Vertical Scaling

- Increase CPU/RAM per instance
- Use for database (up to a point)
- Less flexible than horizontal

### Database Scaling

```
┌──────────────┐
│   Primary    │ ◄── All Writes
│  (Read/Write)│
└──────┬───────┘
       │ replication
       ├────────────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Replica 1   │  │  Replica 2   │ ◄── Read Traffic
│  (Read-only) │  │  (Read-only) │
└──────────────┘  └──────────────┘
```

**Prisma Config:**
```typescript
// Multiple read replicas
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Primary
    },
  },
});

// Read from replica
prisma.$queryRaw`SELECT * FROM Image`.$queryRawUnsafe({
  datasourceUrl: process.env.DATABASE_READ_REPLICA_URL,
});
```

### Redis Scaling

```
Redis Cluster (Recommended for Production)
├── Master 1 (slots 0-5460)
├── Master 2 (slots 5461-10922)
├── Master 3 (slots 10923-16383)
└── Each master has 1+ replicas
```

**Config:**
```typescript
// Redis Cluster
new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 },
]);
```

### Queue Worker Scaling

```bash
# Separate worker deployment
docker run -e WORKER_MODE=true gallery-api

# Multiple workers process jobs in parallel
Worker 1 ─┐
Worker 2 ─┼─► Bull Queue ◄─── API Instances
Worker 3 ─┘
```

**Auto-scaling Rules:**
- Queue length > 100 → Add worker
- Queue length < 20 → Remove worker
- Job latency > 30s → Add worker

## Performance Optimizations

### 1. **Connection Pooling**
```typescript
// Prisma (default pool: 10)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
  pool_timeout = 10
}
```

### 2. **Redis Pipelining**
```typescript
const pipeline = redis.getClient().pipeline();
pipeline.del('images:all');
pipeline.del(`images:${id}`);
await pipeline.exec();
```

### 3. **Batch Operations**
```typescript
// Instead of N queries
const images = await Promise.all(ids.map(id => findOne(id)));

// Use batch query
const images = await prisma.image.findMany({
  where: { id: { in: ids } }
});
```

### 4. **Compression**
```typescript
// main.ts
import compression from 'compression';
app.use(compression());
```

## Security Best Practices

### 1. **Input Validation**
- ✅ Class-validator DTOs
- ✅ Global ValidationPipe
- ✅ File type validation

### 2. **Rate Limiting**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

### 3. **Authentication (Future)**
```typescript
import { JwtModule } from '@nestjs/jwt';

@UseGuards(JwtAuthGuard)
@Controller('images')
```

### 4. **File Upload Limits**
```typescript
FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      cb(new Error('Only images allowed'), false);
    }
    cb(null, true);
  },
})
```

## Monitoring & Observability

### Datadog Metrics

```typescript
// Custom business metrics
tracer.dogstatsd.increment('images.uploaded');
tracer.dogstatsd.histogram('upload.size', file.size);
tracer.dogstatsd.gauge('queue.length', await getQueueLength());
```

### Health Checks

```
GET /health
{
  "status": "ok",
  "timestamp": "2025-10-01T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 134217728,
    "heapTotal": 67108864,
    "heapUsed": 33554432
  }
}
```

### Logging Best Practices

```typescript
// Structured logging
this.logger.log({
  message: 'Image uploaded',
  imageId: image.id,
  size: file.size,
  duration: Date.now() - start,
});

// Error logging
this.logger.error({
  message: 'Upload failed',
  error: err.message,
  stack: err.stack,
  imageId: id,
});
```

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deploy to AWS ECS/K8s/etc
```

## Common Operations

### Scale Workers
```bash
# Docker Compose
docker-compose up -d --scale api=3

# Kubernetes
kubectl scale deployment gallery-worker --replicas=5
```

### Clear Cache
```bash
# CLI
redis-cli FLUSHDB

# Via API (add admin endpoint)
DELETE /admin/cache
```

### Monitor Queue
```bash
# Bull Board UI
open http://localhost:3000/admin/queues

# Redis CLI
redis-cli LLEN bull:image-processing:wait
```

### Database Backup
```bash
# PostgreSQL
docker exec gallery-postgres pg_dump -U postgres image_gallery > backup.sql

# Restore
docker exec -i gallery-postgres psql -U postgres image_gallery < backup.sql
```

## Troubleshooting

### High Memory Usage
- Check queue length (too many pending jobs)
- Verify cache eviction working
- Review heap dump: `node --inspect dist/main.js`

### Slow Responses
- Check Datadog APM traces
- Review slow query log in PostgreSQL
- Verify Redis cache hit rate

### Queue Stuck
- Check Bull Board for failed jobs
- Review processor logs
- Verify Redis connectivity

### S3 Upload Failures
- Verify credentials in .env
- Check bucket exists and permissions
- Review network connectivity to endpoint


