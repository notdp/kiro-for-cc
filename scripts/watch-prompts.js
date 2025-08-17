#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const promptsDir = path.join(__dirname, '..', 'src', 'prompts');

console.log('👀 Watching for prompt file changes...');

// Watch for changes in .md files
fs.watch(promptsDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith('.md')) {
    console.log(`🔄 Detected change in ${filename}, rebuilding...`);

    exec('npm run build-prompts', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Build failed: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️  Build warnings: ${stderr}`);
      }
      console.log('✅ Prompts rebuilt successfully');
    });
  }
});

// Run initial build
exec('npm run build-prompts', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Initial build failed: ${error}`);
    return;
  }
  console.log('✅ Initial build complete');
});