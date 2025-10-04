# OpenAPI 3 Specification Types Generation Guide

This guide explains how to generate and use OpenAPI 3 specification types for the NestJS Gallery API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Types (Choose one method)

#### Method A: Generate Everything (Recommended)
```bash
npm run generate:all
```

#### Method B: Step by Step
```bash
# 1. Build the application
npm run build

# 2. Generate OpenAPI specification
npm run generate:openapi

# 3. Start the server (in another terminal)
npm run start:dev

# 4. Generate TypeScript types
npm run generate:types
```

## 📁 Generated Files

After running the generation scripts, you'll have:

```
generated/
├── openapi.json          # OpenAPI 3.0 specification (JSON)
└── openapi.yaml          # OpenAPI 3.0 specification (YAML)

src/types/
└── api.ts                # Generated TypeScript types
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run generate:openapi` | Generate OpenAPI JSON/YAML specs only |
| `npm run generate:types` | Generate TypeScript types from running server |
| `npm run generate:all` | Complete generation process (recommended) |

## 📋 OpenAPI Endpoints

Your API automatically exposes:

- **Swagger UI**: `http://localhost:3001/api`
- **OpenAPI JSON**: `http://localhost:3001/api-json`
- **OpenAPI YAML**: `http://localhost:3001/api-yaml`

## 🎯 Using Generated Types

### In Frontend Applications

```typescript
import type { paths, components } from './api';

// Type-safe API calls
type ImageResponse = paths['/api/v1/images/{id}']['get']['responses']['200']['content']['application/json'];
type CreateImageRequest = paths['/api/v1/images']['post']['requestBody']['content']['multipart/form-data'];

// Using with fetch
async function getImage(id: string): Promise<ImageResponse> {
  const response = await fetch(`/api/v1/images/${id}`);
  return response.json();
}

// Using with axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

async function createImage(data: CreateImageRequest) {
  const response = await api.post('/api/v1/images', data);
  return response.data;
}
```

### In Backend Services

```typescript
import type { components } from './api';

// Use generated types for validation
type Image = components['schemas']['Image'];
type CreateImageDto = components['schemas']['CreateImageDto'];

// Type-safe service methods
class ImageService {
  async createImage(data: CreateImageDto): Promise<Image> {
    // Implementation
  }
}
```

## 🔄 Integration with Frontend

### For React/Next.js Applications

1. **Copy the generated types** to your frontend project:
   ```bash
   cp src/types/api.ts ../nestjs-gallery-ui/src/types/api.ts
   ```

2. **Use with React Query/SWR**:
   ```typescript
   import { useQuery } from '@tanstack/react-query';
   import type { paths } from './types/api';

   type Image = paths['/api/v1/images/{id}']['get']['responses']['200']['content']['application/json'];

   function useImage(id: string) {
     return useQuery<Image>({
       queryKey: ['image', id],
       queryFn: () => fetch(`/api/v1/images/${id}`).then(res => res.json())
     });
   }
   ```

3. **Use with Form Libraries**:
   ```typescript
   import { useForm } from 'react-hook-form';
   import type { components } from './types/api';

   type CreateImageForm = components['schemas']['CreateImageDto'];

   function CreateImageForm() {
     const { register, handleSubmit } = useForm<CreateImageForm>();
     
     const onSubmit = (data: CreateImageForm) => {
       // Type-safe form submission
     };
   }
   ```

## 🛠️ Advanced Configuration

### Custom Type Generation

You can customize the type generation by modifying the `openapi-typescript` command:

```bash
# Generate with custom options
npx openapi-typescript http://localhost:3001/api-json \
  -o src/types/api.ts \
  --transform \
  --immutable-types \
  --default-non-nullable
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/generate-types.yml
name: Generate API Types
on:
  push:
    branches: [main]
    paths: ['src/**/*.ts']

jobs:
  generate-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run generate:all
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add generated/ src/types/
          git diff --staged --quiet || git commit -m "Update API types"
          git push
```

## 🐛 Troubleshooting

### Common Issues

1. **Server not running**: Make sure the NestJS server is running before generating types
2. **Build errors**: Run `npm run build` first
3. **Permission errors**: Make sure the `scripts/` directory is executable

### Manual Type Generation

If automated generation fails, you can manually generate types:

```bash
# 1. Start the server
npm run start:dev

# 2. In another terminal, generate types
curl http://localhost:3001/api-json > openapi.json
npx openapi-typescript openapi.json -o src/types/api.ts
```

## 📚 Additional Resources

- [OpenAPI TypeScript Documentation](https://openapi-ts.pages.dev/)
- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)

## 🔄 Keeping Types Updated

To keep your types synchronized with API changes:

1. **Development**: Run `npm run generate:all` after making API changes
2. **Pre-commit**: Add type generation to your pre-commit hooks
3. **CI/CD**: Automate type generation in your deployment pipeline

## 📝 Example Generated Types

The generated `api.ts` file will contain:

```typescript
export interface paths {
  "/api/v1/images": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["Image"][];
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          "multipart/form-data": components["schemas"]["CreateImageDto"];
        };
      };
      responses: {
        201: {
          content: {
            "application/json": components["schemas"]["Image"];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    Image: {
      id: string;
      title?: string;
      description?: string;
      originalName: string;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
      s3Key?: string;
      s3Url?: string;
      status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
      createdAt: string;
      updatedAt: string;
    };
    CreateImageDto: {
      title?: string;
      description?: string;
    };
  };
}
```

This provides full type safety across your entire API surface!
