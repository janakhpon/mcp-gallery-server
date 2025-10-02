# NestJS Gallery API

Production-ready image gallery API with async processing and real-time notifications.

## 🚀 Quick Start

```bash
# 1. Setup
cp env.example .env
docker-compose up -d
npm install

# 2. Database
npx prisma migrate dev --name init
npx prisma generate

# 3. Run
npm run start:dev

# 4. Test (optional)
npm test              # Unit tests
npm run test:e2e      # Integration tests
```

**Access:**
- 📚 API Docs: http://localhost:3001/api
- 📊 Queue Monitor: http://localhost:3001/admin/queues
- 📈 Grafana: http://localhost:3002 (admin/admin)
- 💚 Health: http://localhost:3001/health

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | NestJS 11 (Node.js + TypeScript) |
| **Database** | PostgreSQL 15 + Prisma ORM |
| **Cache/Queue** | Redis 7 (ioredis + Bull) |
| **Storage** | S3/MinIO |
| **API Docs** | OpenAPI 3.0 / Swagger UI |
| **Security** | Helmet, CORS, ValidationPipe |
| **Logging** | Pino (structured JSON) |
| **Monitoring** | Prometheus + Grafana + Loki (free!) |

## Prerequisites

- Node.js v18+
- Docker & Docker Compose

## Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd nestjs-gallery-api
npm install

# 2. Environment
cp env.example .env

# 3. Infrastructure
docker-compose up -d

# 4. Database
npx prisma migrate dev --name init
npx prisma generate

# 5. Run
npm run start:dev
```

## 🌐 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **API (Swagger)** | http://localhost:3001/api | - |
| **Health Check** | http://localhost:3001/health | - |
| **Metrics (Prometheus)** | http://localhost:3001/metrics | - |
| **Bull Board** | http://localhost:3001/admin/queues | - |
| **SSE Notifications** | http://localhost:3001/api/v1/notifications/stream | - |
| **Grafana Dashboard** | http://localhost:3002 | `admin` / `admin` |
| **Prometheus UI** | http://localhost:9090 | - |
| **MinIO Console** | http://localhost:9001 | `minio` / `minio123` |
| **PostgreSQL** | localhost:5432 | `postgres` / `postgres` |
| **Redis** | localhost:6379 | - |

## Development

### Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### Database Management

- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio (database GUI)

## 📡 API Endpoints

### Images (REST API)
```
GET    /api/v1/images              # List all images (cached)
POST   /api/v1/images              # Upload image (multipart/form-data)
GET    /api/v1/images/:id          # Get image details (cached)
GET    /api/v1/images/:id/download # Get presigned download URL 🔒
PATCH  /api/v1/images/:id          # Update metadata
DELETE /api/v1/images/:id          # Delete image
```

### Notifications (Real-time)
```
GET    /api/v1/notifications/stream   # SSE stream for job completion
```

### Health & Monitoring
```
GET    /                       # Quick health check
GET    /health                 # Detailed health + metrics
GET    /metrics                # Prometheus metrics
GET    /admin/queues           # Bull Board dashboard
GET    /api                    # Swagger UI
```

### MCP Integration (AI Clients) 🤖
```bash
# For Cursor (Simple!)
cursor .                    # Open in Cursor
npm run start:dev          # Start API
# Ask: "Show me my gallery images using MCP"

# For Claude Desktop (Advanced)
# See MCP_INTEGRATION.md for details
```

## Environment Variables

See `env.example` for all available environment variables.

## Docker Services

The application uses the following Docker services:

- **PostgreSQL 15**: Database server
- **Redis 7**: Cache and job queue
- **MinIO**: S3-compatible object storage

## 🎨 Frontend Integration

### React/Next.js Example

```typescript
// Image Upload Component
async function uploadImage(file: File, metadata: { title?: string; description?: string }) {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);

  const response = await fetch('http://localhost:3000/api/v1/images', {
    method: 'POST',
    body: formData,
  });

  return response.json(); // { id, status: 'PENDING', ... }
}

// Real-time Notification Listener
function useImageNotifications() {
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3000/api/v1/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      console.log('Image ready:', notification);
      // { imageId, status: 'READY', s3Url, timestamp }
      
      // Update UI, show toast, etc.
      toast.success(`Image ${notification.title} is ready!`);
    };

    return () => eventSource.close();
  }, []);
}

// Fetch Images List
async function fetchImages() {
  const response = await fetch('http://localhost:3000/api/v1/images');
  return response.json();
}
```

### Vue/Nuxt Example

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const images = ref([]);
let eventSource = null;

async function uploadImage(file, title, description) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description);

  const res = await fetch('http://localhost:3000/api/v1/images', {
    method: 'POST',
    body: formData,
  });

  const newImage = await res.json();
  images.value.unshift(newImage);
}

onMounted(() => {
  // Listen to notifications
  eventSource = new EventSource('http://localhost:3000/api/v1/notifications/stream');
  eventSource.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    // Update image status in the list
    const image = images.value.find(img => img.id === notification.imageId);
    if (image) {
      image.status = notification.status;
      image.s3Url = notification.s3Url;
    }
  };
});

onUnmounted(() => {
  eventSource?.close();
});
</script>
```

## 📊 Production Checklist

- [ ] **Environment**: Set `NODE_ENV=production`
- [ ] **Secrets**: Rotate database/Redis passwords
- [ ] **CORS**: Set `CORS_ORIGIN` to your frontend domain
- [ ] **Database**: Enable SSL, connection pooling
- [ ] **Redis**: Use cluster/sentinel for HA
- [ ] **S3**: Use AWS S3 (not MinIO) for production
- [ ] **Monitoring**: Set up APM (Datadog, New Relic)
- [ ] **Logging**: Ship logs to aggregation service
- [ ] **Backups**: Automated DB backups (daily)
- [ ] **CDN**: Use CloudFront for S3 assets
- [ ] **Health Checks**: Configure load balancer probes
- [ ] **Rate Limiting**: Add throttling (e.g., @nestjs/throttler)

## License

MIT License - see [LICENSE](LICENSE) for details.


---

## 🏗️ Architecture

```
src/
├── app.module.ts        # Root module
├── images/              # Images feature module
│   ├── dto/             # DTOs with validation
│   ├── entities/        # TypeScript entities
│   ├── images.controller.ts
│   ├── images.service.ts
│   └── images.module.ts
├── jobs/                # Jobs feature module
│   ├── queue/           # Bull queue producer
│   ├── processor/       # Bull queue consumer
│   └── jobs.module.ts
├── shared/              # Shared/Global module
│   ├── redis/           # Redis client (caching + pub/sub)
│   ├── s3/              # S3/MinIO client
│   ├── notifications/   # Notification service
│   └── shared.module.ts # @Global() exports
├── notifications/       # Notifications controller (SSE)
└── prisma/              # Prisma ORM service
```

### Module Structure
- **SharedModule** (`@Global`): Redis, S3, Notifications - available everywhere
- **JobsModule**: Queue producer/consumer - imported by ImagesModule
- **ImagesModule**: Image CRUD feature - standalone
- **AppModule**: Orchestrates all modules

## 🔄 Image Upload Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant PostgreSQL
    participant S3
    participant Redis/Bull
    participant Worker
    participant SSE

    Client->>API: POST /api/v1/images (multipart)
    API->>PostgreSQL: Save metadata (status: PENDING)
    API->>S3: Upload original file
    API->>Redis/Bull: Enqueue job
    API-->>Client: 201 Created (with image ID)
    
    Redis/Bull->>Worker: Process job
    Worker->>PostgreSQL: Update status (PROCESSING)
    Worker->>PostgreSQL: Set s3Url & status (READY)
    Worker->>Redis: Publish notification
    Redis-->>SSE: Broadcast to subscribers
    SSE-->>Client: Real-time notification
```

### **Step-by-Step**
1. **Upload**: Client sends image + metadata → API saves to DB (PENDING) + S3
2. **Queue**: Job enqueued to Bull/Redis for async processing
3. **Process**: Worker updates DB with S3 URL, sets status READY
4. **Notify**: Redis pub/sub broadcasts completion to all SSE subscribers
5. **Cache**: Redis caches responses (60s for list, 300s for detail)

### **Caching Strategy**
- ✅ **Cache on Read**: List/detail endpoints cache in Redis
- ✅ **Invalidate on Write**: Create/update/delete clear relevant caches
- ✅ **TTL-based**: Automatic expiry (60s list, 300s detail)

## 🚀 Scalable Deployment

### Architecture for Production

```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                      │
│                  (NGINX / ALB)                       │
└──────────┬────────────────────────────┬─────────────┘
           │                            │
    ┌──────▼──────┐              ┌──────▼──────┐
    │  NestJS API │              │  NestJS API │
    │  Instance 1 │              │  Instance 2 │
    └──────┬──────┘              └──────┬──────┘
           │                            │
           └──────────┬─────────────────┘
                      │
    ┌─────────────────▼──────────────────┐
    │         Shared Services             │
    ├─────────────────────────────────────┤
    │  PostgreSQL (Primary + Replicas)    │
    │  Redis (Cluster / Sentinel)         │
    │  S3 / MinIO (Object Storage)        │
    └─────────────────────────────────────┘
```

### Deployment Options

#### **Option 1: Docker Compose (Development/Small Scale)**
```bash
docker-compose up -d
# Pros: Simple, all-in-one
# Cons: Single server limit
```

#### **Option 2: Kubernetes (Production/Large Scale)**
```yaml
# Deployment structure:
- API Pods (3+ replicas, autoscaling)
- Worker Pods (separate deployment for queue processing)
- PostgreSQL (StatefulSet or managed RDS)
- Redis (StatefulSet or managed ElastiCache)
- S3/MinIO (managed S3 or StatefulSet)
```

#### **Option 3: Serverless (AWS Lambda + managed services)**
```
- API: Lambda + API Gateway
- Workers: Lambda triggered by SQS
- Database: RDS PostgreSQL
- Cache: ElastiCache Redis
- Storage: S3
```

### Scaling Guidelines

| Component | Scaling Strategy | Metric |
|-----------|------------------|--------|
| **API** | Horizontal (add instances) | CPU > 70% |
| **Workers** | Horizontal (add instances) | Queue length > 100 |
| **PostgreSQL** | Vertical + read replicas | Connection pool > 80% |
| **Redis** | Vertical or cluster | Memory > 75% |
| **S3/MinIO** | Automatic (S3) / add nodes (MinIO) | Storage usage |

### Environment-specific Configs

```env
# Development
NODE_ENV=development
REDIS_HOST=localhost

# Production
NODE_ENV=production
REDIS_HOST=redis-cluster.prod.internal
DATABASE_URL=postgresql://user:pass@prod-db.rds.aws:5432/db
S3_ENDPOINT=  # Use AWS S3
CORS_ORIGIN=https://app.yourdomain.com
```