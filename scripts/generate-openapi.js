#!/usr/bin/env node

const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');
const fs = require('fs');
const path = require('path');

async function generateOpenAPISpec() {
  try {
    console.log('🚀 Starting OpenAPI specification generation...');
    
    // Create the NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    // Configure the OpenAPI document
    const config = new DocumentBuilder()
      .setTitle('Gallery API')
      .setDescription('Image gallery with async processing and real-time notifications')
      .setVersion('1.0.0')
      .addServer('http://localhost:3001', 'Development')
      .addServer('https://api.production.com', 'Production')
      .addBearerAuth()
      .build();

    // Generate the OpenAPI document
    const document = SwaggerModule.createDocument(app, config);

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the OpenAPI specification to file
    const specPath = path.join(outputDir, 'openapi.json');
    fs.writeFileSync(specPath, JSON.stringify(document, null, 2));

    // Also write a YAML version
    const yaml = require('js-yaml');
    const yamlPath = path.join(outputDir, 'openapi.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(document, { indent: 2 }));

    console.log('✅ OpenAPI specification generated successfully!');
    console.log(`📄 JSON: ${specPath}`);
    console.log(`📄 YAML: ${yamlPath}`);
    console.log(`🌐 Swagger UI: http://localhost:3001/api`);
    console.log(`📋 JSON endpoint: http://localhost:3001/api-json`);

    // Close the application
    await app.close();
    
    return { specPath, yamlPath };
  } catch (error) {
    console.error('❌ Error generating OpenAPI specification:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateOpenAPISpec();
}

module.exports = { generateOpenAPISpec };
