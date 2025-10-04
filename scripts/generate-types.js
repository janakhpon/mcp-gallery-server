#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generateTypes() {
  try {
    console.log('🚀 Starting type generation process...');
    
    // Step 1: Build the application
    console.log('📦 Building NestJS application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Generate OpenAPI specification
    console.log('📋 Generating OpenAPI specification...');
    execSync('npm run generate:openapi', { stdio: 'inherit' });
    
    // Step 3: Start the server temporarily to generate types
    console.log('🌐 Starting server for type generation...');
    const serverProcess = execSync('npm run start:prod', { 
      stdio: 'pipe',
      timeout: 10000 // 10 seconds timeout
    });
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Step 4: Generate TypeScript types from OpenAPI spec
      console.log('🔧 Generating TypeScript types...');
      execSync('npm run generate:types', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Type generation failed, trying alternative method...');
      
      // Alternative: Generate types from local spec file
      const specPath = path.join(__dirname, '..', 'generated', 'openapi.json');
      if (fs.existsSync(specPath)) {
        execSync(`npx openapi-typescript ${specPath} -o src/types/api.ts`, { stdio: 'inherit' });
      } else {
        throw new Error('OpenAPI spec file not found');
      }
    }
    
    console.log('✅ Type generation completed successfully!');
    console.log('📁 Generated files:');
    console.log('  - generated/openapi.json');
    console.log('  - generated/openapi.yaml');
    console.log('  - src/types/api.ts');
    
  } catch (error) {
    console.error('❌ Error during type generation:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateTypes();
}

module.exports = { generateTypes };
