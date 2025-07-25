#!/usr/bin/env node

/**
 * Test script for Supabase MCP server
 * Run with: node scripts/test-mcp.js
 */

const { spawn } = require('child_process');

console.log('🧪 Testing Supabase MCP Server...');
console.log('Project Ref: qqbbssxxddcsuboiceey');
console.log('Mode: Read-only');
console.log('');

// Set environment variable
process.env.SUPABASE_ACCESS_TOKEN = 'sbp_dd2386f91bee51b52c7e3af6ab78539c833b9159';

// Run the MCP server
const mcp = spawn(
  'npx',
  [
    '-y',
    '@supabase/mcp-server-supabase@latest',
    '--read-only',
    '--project-ref=qqbbssxxddcsuboiceey',
  ],
  {
    stdio: 'inherit',
    env: process.env,
  }
);

mcp.on('close', code => {
  console.log(`\n🏁 MCP server exited with code ${code}`);
});

mcp.on('error', err => {
  console.error('❌ Error running MCP server:', err.message);
  console.log('\n💡 Make sure you have the latest version:');
  console.log('   npm install -g @supabase/mcp-server-supabase');
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping MCP server...');
  mcp.kill('SIGINT');
});
