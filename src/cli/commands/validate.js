const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ConfigLoader = require('../../config/loader');
const { parseDateRange } = require('../../utils/dateUtils');
const { getAdapter } = require('../../adapters');

/**
 * Validation tool
 */
async function validate(options = {}) {
  const errors = [];
  const warnings = [];

  console.log('🔍 Validating Timesheet Generator Configuration...\n');

  // 1. Validate config file
  console.log('1. Checking configuration file...');
  try {
    const configLoader = new ConfigLoader();
    const config = configLoader.load();
    console.log('   ✅ Configuration file is valid');
  } catch (error) {
    errors.push(`Config file error: ${error.message}`);
    console.log(`   ❌ ${error.message}`);
  }

  // 2. Validate repository
  console.log('\n2. Checking repository...');
  const repoPath = options.repo || process.cwd();
  try {
    execSync(`git -C "${repoPath}" rev-parse --is-inside-work-tree`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    console.log(`   ✅ Valid git repository: ${repoPath}`);
  } catch (error) {
    errors.push(`Not a valid git repository: ${repoPath}`);
    console.log(`   ❌ Not a valid git repository: ${repoPath}`);
  }

  // 3. Validate date range
  console.log('\n3. Checking date range...');
  try {
    const configLoader = new ConfigLoader();
    const config = configLoader.load();
    const range = parseDateRange(config.defaults.dateRange);
    console.log(`   ✅ Date range "${config.defaults.dateRange}" is valid`);
    console.log(`      Start: ${range.start.toISOString().split('T')[0]}`);
    console.log(`      End: ${range.end.toISOString().split('T')[0]}`);
  } catch (error) {
    errors.push(`Invalid date range: ${error.message}`);
    console.log(`   ❌ ${error.message}`);
  }

  // 4. Validate adapter availability
  console.log('\n4. Checking adapters...');
  try {
    const adapter = getAdapter('local', repoPath);
    const repoInfo = await adapter.getRepoInfo();
    console.log(`   ✅ Local adapter: ${repoInfo.name}`);
  } catch (error) {
    warnings.push(`Local adapter issue: ${error.message}`);
    console.log(`   ⚠️  ${error.message}`);
  }

  // 5. Check environment variables
  console.log('\n5. Checking environment variables...');
  const envVars = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITLAB_TOKEN: process.env.GITLAB_TOKEN,
    LINEAR_API_KEY: process.env.LINEAR_API_KEY,
    TOGGL_API_TOKEN: process.env.TOGGL_API_TOKEN,
    CLOCKIFY_API_KEY: process.env.CLOCKIFY_API_KEY,
  };

  let hasAnyToken = false;
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`   ✅ ${key} is set`);
      hasAnyToken = true;
    }
  }

  if (!hasAnyToken) {
    warnings.push('No API tokens configured (GitHub/GitLab/Linear/Toggl/Clockify)');
    console.log('   ⚠️  No API tokens configured');
  }

  // 6. Validate Node.js version
  console.log('\n6. Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} (requires 18+)`);
  } else {
    errors.push(`Node.js version ${nodeVersion} is too old (requires 18+)`);
    console.log(`   ❌ Node.js ${nodeVersion} (requires 18+)`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed!');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ ${errors.length} error(s) found:`);
      errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} warning(s):`);
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
    }
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

module.exports = { validate };

