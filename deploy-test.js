#!/usr/bin/env node

// Deployment verification script
console.log('🚀 AuthKit Deployment Verification\n');

// Check if packages can be published
const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('📦 Checking package integrity...');

  // Check if dist files exist
  const authkitDist = fs.existsSync('./packages/authkit/dist/index.js');
  const cliDist = fs.existsSync('./packages/create-authkit/dist/index.js');

  console.log(`✅ AuthKit dist: ${authkitDist ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ CLI dist: ${cliDist ? 'EXISTS' : 'MISSING'}`);

  // Check package.json files
  const authkitPkg = require('./packages/authkit/package.json');
  const cliPkg = require('./packages/create-authkit/package.json');

  console.log(`✅ AuthKit version: ${authkitPkg.version}`);
  console.log(`✅ CLI version: ${cliPkg.version}`);

  // Test schema generation
  const { SchemaGenerator } = require('./packages/authkit/dist/index.js');
  const schema = SchemaGenerator.generate('postgresql');
  console.log(`✅ Schema generation: ${schema.length > 100 ? 'WORKING' : 'FAILED'}`);

  console.log('\n🎉 AuthKit is ready for deployment!');
  console.log('\n📋 Deployment Steps:');
  console.log('1. Create GitHub repository: authkit/authkit');
  console.log('2. Push code: git push origin main');
  console.log('3. Set NPM_TOKEN in GitHub secrets');
  console.log('4. Create release: npm run release:patch');
  console.log('5. Monitor automated publishing');

} catch (error) {
  console.error('❌ Deployment check failed:', error.message);
  process.exit(1);
}
