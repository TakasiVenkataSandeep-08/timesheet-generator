const fs = require('fs');
const path = require('path');

/**
 * Project Mappings - user-defined project mappings
 */

/**
 * Load project mappings from config file
 */
function loadProjectMappings(configPath = null) {
  const configFile = configPath || path.join(process.cwd(), '.timesheetrc');
  
  try {
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return config.projects || {};
    }
  } catch (error) {
    // Config file doesn't exist or is invalid, return empty
  }

  return {};
}

/**
 * Default project mappings based on common patterns
 */
const defaultMappings = {
  frontend: {
    branches: ['feature/frontend/*', 'fix/frontend/*', 'frontend/*'],
    files: ['src/components/**', 'src/pages/**', 'src/styles/**', '*.tsx', '*.jsx'],
    keywords: ['frontend', 'ui', 'component', 'react', 'vue', 'angular'],
  },
  backend: {
    branches: ['feature/backend/*', 'fix/backend/*', 'api/*'],
    files: ['src/api/**', 'src/server/**', 'src/controllers/**', '*.py', '*.java', '*.go'],
    keywords: ['backend', 'api', 'server', 'endpoint'],
  },
  mobile: {
    branches: ['feature/mobile/*', 'fix/mobile/*', 'ios/*', 'android/*'],
    files: ['ios/**', 'android/**', '*.swift', '*.kt'],
    keywords: ['mobile', 'ios', 'android', 'react-native'],
  },
  infrastructure: {
    branches: ['feature/infra/*', 'fix/infra/*'],
    files: ['docker/**', 'kubernetes/**', 'terraform/**', '*.tf', '*.yml'],
    keywords: ['infrastructure', 'devops', 'deployment', 'ci/cd'],
  },
};

/**
 * Get project mappings (user-defined + defaults)
 */
function getProjectMappings(configPath = null) {
  const userMappings = loadProjectMappings(configPath);
  return {
    ...defaultMappings,
    ...userMappings,
  };
}

/**
 * Learn project from branch pattern
 */
function learnFromBranch(branch) {
  const parts = branch.split('/');
  if (parts.length >= 2) {
    return parts[1]; // e.g., feature/project-name -> project-name
  }
  return null;
}

/**
 * Learn project from file path
 */
function learnFromFilePath(filePath) {
  const parts = filePath.split('/');
  
  // Common patterns
  if (parts[0] === 'src') {
    return parts[1] || null; // e.g., src/frontend/file.js -> frontend
  }
  
  if (parts[0] === 'packages' || parts[0] === 'apps') {
    return parts[1] || null; // e.g., packages/api/file.js -> api
  }

  return null;
}

module.exports = {
  loadProjectMappings,
  getProjectMappings,
  defaultMappings,
  learnFromBranch,
  learnFromFilePath,
};

