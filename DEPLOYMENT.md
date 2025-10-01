# Deployment Guide

## Production Deployment Blueprint

### AWS Architecture (Recommended)

```
Internet → CloudFront (CDN) → ALB (Load Balancer)
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
              ECS Task 1      ECS Task 2      ECS Task 3
             (API+Worker)    (API+Worker)    (API+Worker)
                  │               │               │
                  └───────────────┼───────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
        RDS PostgreSQL      ElastiCache Redis         S3
        (Multi-AZ)          (Cluster Mode)         (Images)
```

### Infrastructure as Code (Terraform Example)

```hcl
# ECS Cluster
resource "aws_ecs_cluster" "gallery" {
  name = "gallery-api-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  multi_az             = true
  backup_retention_period = 7
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "gallery-redis"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 2
}

# S3 Bucket
resource "aws_s3_bucket" "images" {
  bucket = "gallery-images-prod"
  
  lifecycle_rule {
    enabled = true
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

### Docker Build for Production

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Kubernetes Deployment

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gallery-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gallery-api
  template:
    metadata:
      labels:
        app: gallery-api
    spec:
      containers:
      - name: api
        image: your-registry/gallery-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: gallery-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gallery-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gallery-worker
  template:
    metadata:
      labels:
        app: gallery-worker
    spec:
      containers:
      - name: worker
        image: your-registry/gallery-api:latest
        command: ["node", "dist/main"]
        env:
        - name: NODE_ENV
          value: "production"
        - name: WORKER_ONLY
          value: "true"
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Build Docker image
        run: docker build -t gallery-api:${{ github.sha }} .
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag gallery-api:${{ github.sha }} $ECR_REGISTRY/gallery-api:latest
          docker push $ECR_REGISTRY/gallery-api:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster gallery-cluster --service gallery-api --force-new-deployment
```

### Monitoring Setup

```typescript
// main.ts - Add Datadog/New Relic
import * as ddTrace from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  ddTrace.init({
    service: 'gallery-api',
    env: process.env.NODE_ENV,
  });
}
```

### Production Environment Variables

```env
# Production .env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.yourdomain.com

# Database (RDS)
DATABASE_URL=postgresql://user:password@prod-db.rds.amazonaws.com:5432/gallery?sslmode=require

# Redis (ElastiCache)
REDIS_HOST=prod-redis.cache.amazonaws.com
REDIS_PORT=6379

# S3 (Production)
S3_ENDPOINT=
S3_REGION=us-east-1
S3_BUCKET=gallery-images-prod
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false

# Monitoring
DD_API_KEY=your_datadog_api_key
DD_APP_KEY=your_datadog_app_key
```

### Performance Tuning

```typescript
// Prisma connection pool (production)
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 20
  connection_limit = 20
}

// Bull queue concurrency
this.queue = new Bull('image-processing', {
  redis: { host: redisHost, port: redisPort },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000,
  },
  limiter: {
    max: 10,
    duration: 1000,
  },
});
```

### Cost Optimization

| Service | Dev | Staging | Production |
|---------|-----|---------|------------|
| **ECS Tasks** | 1 task (t3.small) | 2 tasks (t3.medium) | 3-5 tasks (t3.large) + autoscaling |
| **RDS** | db.t3.micro | db.t3.small | db.t3.medium (Multi-AZ) |
| **ElastiCache** | cache.t3.micro | cache.t3.small | cache.t3.medium (cluster) |
| **S3** | Standard | Standard | Standard + Lifecycle (IA after 30 days) |
| **Estimated Cost** | ~$50/mo | ~$150/mo | ~$400/mo |


