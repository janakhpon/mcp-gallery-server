# Contributing Guide

## Development Workflow

### 1. Setup
```bash
git clone <repo-url>
cd nestjs-gallery-api
npm install
cp env.example .env
docker-compose up -d
npx prisma migrate dev
npm run start:dev
```

### 2. Make Changes
- Create feature branch: `git checkout -b feature/your-feature`
- Write code following existing patterns
- Add tests if needed
- Update documentation

### 3. Code Quality
```bash
# Format code
npm run format

# Lint
npm run lint

# Build
npm run build

# Test
npm run test
```

### 4. Commit
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### 5. Pull Request
- Open PR against `main` branch
- Describe changes
- Link related issues
- Wait for review

## Code Standards

### TypeScript
- Use strict typing (no `any`)
- Prefer interfaces over types
- Use Prisma-generated types where possible

### NestJS
- Follow module pattern
- Use dependency injection
- Implement proper error handling

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### File Structure
```
feature/
├── dto/
│   ├── create-feature.dto.ts
│   └── update-feature.dto.ts
├── entities/
│   └── feature.entity.ts
├── feature.controller.ts
├── feature.service.ts
└── feature.module.ts
```

## Git Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Add or update tests
chore: Maintenance tasks
```

## Questions?

Open an issue or start a discussion!


