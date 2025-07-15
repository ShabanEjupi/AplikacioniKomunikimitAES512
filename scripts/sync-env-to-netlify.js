#!/usr/bin/env node

/**
 * 🚀 Quantum-Ready Environment Sync Script
 * Automatically syncs .env variables to Netlify when committing changes
 * 
 * This revolutionary script:
 * - Parses .env file with quantum-level precision
 * - Filters production-ready variables
 * - Automatically updates Netlify environment variables
 * - Maintains security while enabling seamless deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 Configuration
const ENV_FILE = path.join(__dirname, '..', '.env');
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID || 'your-site-id-here';

// 🛡️ Security filters - these variables should NOT be synced automatically
const EXCLUDED_VARS = [
  'SKIP_PREFLIGHT_CHECK',
  'NODE_OPTIONS',
  'NPM_CONFIG_LEGACY_PEER_DEPS',
  'NPM_CONFIG_FORCE',
  'CI',
  'DEBUG_MEMORY_USAGE',
  'ENABLE_PERFORMANCE_PROFILING',
  'MOCK_EXTERNAL_SERVICES'
];

// 🔐 Sensitive variables that need special handling
const SENSITIVE_VARS = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'AES_256_KEY'
];

/**
 * 🧠 Neural Environment Parser
 * Parses .env file with advanced pattern recognition
 */
function parseEnvFile(filePath) {
  console.log('🔍 Parsing environment configuration...');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(filePath, 'utf8');
  const variables = {};
  
  envContent.split('\n').forEach((line, index) => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // Remove quotes if present
      let cleanValue = value;
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        cleanValue = value.slice(1, -1);
      }
      
      variables[key] = cleanValue;
    }
  });
  
  console.log(`✅ Parsed ${Object.keys(variables).length} environment variables`);
  return variables;
}

/**
 * 🎛️ Quantum Filter System
 * Filters variables for production deployment
 */
function filterVariables(variables) {
  console.log('🔧 Filtering variables for production deployment...');
  
  const filtered = {};
  let excluded = 0;
  let sensitive = 0;
  
  Object.entries(variables).forEach(([key, value]) => {
    if (EXCLUDED_VARS.includes(key)) {
      excluded++;
      console.log(`⚠️  Excluded: ${key} (development-only)`);
      return;
    }
    
    if (SENSITIVE_VARS.includes(key)) {
      sensitive++;
      console.log(`🔐 Sensitive: ${key} (requires manual verification)`);
    }
    
    filtered[key] = value;
  });
  
  console.log(`✅ Filtered: ${Object.keys(filtered).length} variables (excluded: ${excluded}, sensitive: ${sensitive})`);
  return filtered;
}

/**
 * 🌐 Netlify Sync Engine
 * Syncs variables to Netlify with quantum entanglement
 */
async function syncToNetlify(variables) {
  console.log('🚀 Syncing to Netlify...');
  
  try {
    // Check if Netlify CLI is available
    execSync('netlify --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Netlify CLI not found! Install with: npm install -g netlify-cli');
    process.exit(1);
  }
  
  // Check if site is linked
  try {
    execSync('netlify status', { stdio: 'pipe' });
  } catch (error) {
    console.log('🔗 Site not linked to Netlify. Run: netlify link');
    return false;
  }
  
  let updated = 0;
  let errors = 0;
  
  for (const [key, value] of Object.entries(variables)) {
    try {
      // Set environment variable in Netlify
      execSync(`netlify env:set ${key} "${value}"`, { stdio: 'pipe' });
      updated++;
      
      if (SENSITIVE_VARS.includes(key)) {
        console.log(`🔐 Updated sensitive: ${key}`);
      } else {
        console.log(`✅ Updated: ${key}=${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Failed to set ${key}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Sync complete! Updated: ${updated}, Errors: ${errors}`);
  return errors === 0;
}

/**
 * 🔮 Future-Proof Validation
 * Validates environment for quantum readiness
 */
function validateEnvironment(variables) {
  console.log('🔍 Validating quantum readiness...');
  
  const required = [
    'NODE_ENV',
    'JWT_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'AES_256_KEY'
  ];
  
  const missing = required.filter(key => !variables[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required variables:', missing.join(', '));
    return false;
  }
  
  // Check secret strength
  const secrets = ['JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY', 'AES_256_KEY'];
  for (const secret of secrets) {
    if (variables[secret] && variables[secret].length < 32) {
      console.warn(`⚠️  ${secret} is too short (< 32 chars) - security risk!`);
    }
  }
  
  console.log('✅ Environment validation passed!');
  return true;
}

/**
 * 🚀 Main Quantum Sync Process
 */
async function main() {
  console.log('🌟 Starting Quantum Environment Sync...\n');
  
  try {
    // Parse environment file
    const variables = parseEnvFile(ENV_FILE);
    
    // Validate environment
    if (!validateEnvironment(variables)) {
      process.exit(1);
    }
    
    // Filter for production
    const filtered = filterVariables(variables);
    
    // Sync to Netlify
    const success = await syncToNetlify(filtered);
    
    if (success) {
      console.log('\n🎉 Quantum sync completed successfully!');
      console.log('🚀 Your app is now ready for interdimensional deployment!');
    } else {
      console.log('\n⚠️  Sync completed with warnings. Check Netlify dashboard.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Quantum sync failed:', error.message);
    process.exit(1);
  }
}

// 🎯 Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { parseEnvFile, filterVariables, syncToNetlify, validateEnvironment };
