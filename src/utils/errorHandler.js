/**
 * Error Handler - provides user-friendly error messages and categorization
 */

/**
 * Error categories
 */
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  PARSING: 'parsing',
  RATE_LIMIT: 'rate_limit',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown',
};

/**
 * Categorize error based on error message or type
 */
function categorizeError(error) {
  if (!error) {
    return ERROR_CATEGORIES.UNKNOWN;
  }

  const message = error.message || String(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('404') ||
    lowerMessage.includes('does not exist')
  ) {
    return ERROR_CATEGORIES.NOT_FOUND;
  }

  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('429') ||
    lowerMessage.includes('too many requests')
  ) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }

  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('bad credentials') ||
    lowerMessage.includes('authentication')
  ) {
    return ERROR_CATEGORIES.AUTHENTICATION;
  }

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnrefused')
  ) {
    return ERROR_CATEGORIES.NETWORK;
  }

  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('parse') ||
    lowerMessage.includes('syntax') ||
    lowerMessage.includes('malformed')
  ) {
    return ERROR_CATEGORIES.PARSING;
  }

  if (
    lowerMessage.includes('required') ||
    lowerMessage.includes('missing') ||
    lowerMessage.includes('validation')
  ) {
    return ERROR_CATEGORIES.VALIDATION;
  }

  return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error, category) {
  const cat = category || categorizeError(error);
  const message = error?.message || String(error);

  switch (cat) {
    case ERROR_CATEGORIES.VALIDATION:
      return `Invalid input: ${message}. Please check your parameters and try again.`;

    case ERROR_CATEGORIES.NETWORK:
      return `Network error: ${message}. Please check your internet connection and try again.`;

    case ERROR_CATEGORIES.AUTHENTICATION:
      return `Authentication failed: ${message}. Please check your API token or credentials.`;

    case ERROR_CATEGORIES.RATE_LIMIT:
      return `Rate limit exceeded: ${message}. Please wait a few minutes before trying again.`;

    case ERROR_CATEGORIES.NOT_FOUND:
      return `Resource not found: ${message}. Please check the repository path or identifier.`;

    case ERROR_CATEGORIES.PARSING:
      return `Data parsing error: ${message}. The data format may be invalid.`;

    default:
      return `An error occurred: ${message}. Please try again or check the documentation.`;
  }
}

/**
 * Get actionable suggestions based on error category
 */
function getSuggestions(category) {
  switch (category) {
    case ERROR_CATEGORIES.AUTHENTICATION:
      return [
        'Check that your API token is set correctly (GITHUB_TOKEN, GITLAB_TOKEN, etc.)',
        'Verify your token has the necessary permissions',
        'Ensure your token has not expired',
      ];

    case ERROR_CATEGORIES.RATE_LIMIT:
      return [
        'Wait a few minutes before retrying',
        'Consider using caching to reduce API calls',
        'Check if you can use a different authentication method',
      ];

    case ERROR_CATEGORIES.NETWORK:
      return [
        'Check your internet connection',
        'Verify the API endpoint is accessible',
        'Check if a firewall or proxy is blocking the request',
      ];

    case ERROR_CATEGORIES.NOT_FOUND:
      return [
        'Verify the repository path or identifier is correct',
        'Check if you have access to the repository',
        'Ensure the repository exists',
      ];

    case ERROR_CATEGORIES.VALIDATION:
      return [
        'Check the command-line arguments',
        'Verify the configuration file format',
        'Review the documentation for required parameters',
      ];

    default:
      return [
        'Check the error message for details',
        'Review the documentation',
        'Try running with DEBUG=1 for more information',
      ];
  }
}

/**
 * Format error for display
 */
function formatError(error, includeStack = false) {
  const category = categorizeError(error);
  const userMessage = getUserFriendlyMessage(error, category);
  const suggestions = getSuggestions(category);

  const formatted = {
    category,
    message: userMessage,
    suggestions,
    originalError: error?.message || String(error),
  };

  if (includeStack && error?.stack) {
    formatted.stack = error.stack;
  }

  return formatted;
}

/**
 * Handle error and return formatted error object
 */
function handleError(error, options = {}) {
  const { includeStack = false, log = true } = options;

  const formatted = formatError(error, includeStack);

  if (log) {
    console.error(`\n❌ Error (${formatted.category}): ${formatted.message}`);
    if (formatted.suggestions.length > 0) {
      console.error('\n💡 Suggestions:');
      formatted.suggestions.forEach((suggestion, index) => {
        console.error(`   ${index + 1}. ${suggestion}`);
      });
    }
    if (process.env.DEBUG && formatted.stack) {
      console.error('\n📚 Stack trace:');
      console.error(formatted.stack);
    }
  }

  return formatted;
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = [ERROR_CATEGORIES.NETWORK, ERROR_CATEGORIES.RATE_LIMIT],
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const category = categorizeError(error);

      // Don't retry if error is not retryable or we've exhausted retries
      if (!retryableErrors.includes(category) || attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

module.exports = {
  ERROR_CATEGORIES,
  categorizeError,
  getUserFriendlyMessage,
  getSuggestions,
  formatError,
  handleError,
  retryWithBackoff,
};

