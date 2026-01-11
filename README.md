# NestJS Gallery API

A premium, minimalist image gallery backend featuring **Model Context Protocol (MCP)** integration and a robust, built-in AI assistant.

## 🚀 Quick Start

```bash
# 1. Environment
cp env.example .env
docker-compose up -d

# 2. Dependencies & Database
npm install
npx prisma migrate dev
npx prisma generate

# 3. Run
npm run start:dev
```

**Service URLs:**

- 📚 API Docs (Swagger): `http://localhost:3000/api`
- 📊 Queue Monitor: `http://localhost:3000/admin/queues`
- 📈 Health Check: `http://localhost:3000/health`

## 🤖 Model Context Protocol (MCP)

This project implements a standardized MCP server. It is **client-agnostic**, meaning any AI system or tool that follows the open MCP specification can securely interact with your gallery.

### Core Capabilities

- **Tools**: List, search, upload, and delete images via standardized function calls.
- **Resources**: Direct access to the `images://catalog` for data analysis.
- **Prompts**: Standardized workflows like `curate_gallery` for collection maintenance.

### Built-in Assistant

The Web and Mobile apps include a robust, built-in assistant that demonstrates these capabilities out-of-the-box, requiring no external applications.

## 🛠 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Prisma)
- **Processing**: Redis (Bull)
- **AI Core**: OpenAI SDK (`gpt-4o-mini`)
- **Storage**: S3-compatible (MinIO/AWS)

## 📁 Project Structure

- `src/images`: Core image processing and management.
- `src/chat`: Built-in AI assistant logic.
- `src/mcp`: Standardized Model Context Protocol server.
- `src/jobs`: Async processing for image optimization.
