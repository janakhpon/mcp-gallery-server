# NestJS Gallery API

A modern image gallery API built with NestJS, featuring image upload, processing, and management capabilities.

## Features

- Image upload and storage using S3/MinIO
- Image processing with Sharp
- Background job processing with Bull/Redis
- PostgreSQL database with Prisma ORM
- RESTful API with Swagger documentation
- Docker containerization

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nestjs-gallery-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Start the application**
   ```bash
   npm run start:dev
   ```

## Service URLs

When running with Docker Compose, the following services are available:

- **PostgreSQL Database**: `postgresql://postgres:postgres@localhost:5432/image_gallery`
- **Redis**: `redis://localhost:6379`
- **MinIO Console**: http://localhost:9001 (admin/minio123)
- **MinIO API**: http://localhost:9000
- **API Documentation**: http://localhost:3000/api (when app is running)

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

## API Endpoints

The API provides the following main endpoints:

- `GET /images` - List all images
- `POST /images` - Upload a new image
- `GET /images/:id` - Get image details
- `PUT /images/:id` - Update image metadata
- `DELETE /images/:id` - Delete an image

## Environment Variables

See `env.example` for all available environment variables.

## Docker Services

The application uses the following Docker services:

- **PostgreSQL 15**: Database server
- **Redis 7**: Cache and job queue
- **MinIO**: S3-compatible object storage

## License

This project is licensed under the MIT License.


```
npm install @nestjs/config @nestjs/platform-express @nestjs/swagger class-validator class-transformer @prisma/client prisma @nestjs/bull bull ioredis sharp @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer helmet pino pino-http bull-board

npm install -D prisma ts-node-dev



npx nest g resource images
npx nest g service shared/s3 
npx nest g service jobs/queue 
npx nest g service jobs/processor 
npx nest g service prisma    


npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init
npx prisma db push
npx prisma generate
```