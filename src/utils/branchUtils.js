/**
 * Check if branch name matches pattern with full glob support
 * @param {string} branchName - Branch name
 * @param {string} pattern - Pattern (e.g., "feature/*", "bugfix/*", "!release/*")
 * @returns {boolean}
 */
function matchesPattern(branchName, pattern) {
  if (!pattern || pattern === "all") {
    return true;
  }

  // Convert glob pattern to regex with full feature support
  let regexPattern = pattern
    .replace(/\*\*/g, ".*") // ** matches any characters including /
    .replace(/\*/g, "[^/]*") // * matches any characters except /
    .replace(/\?/g, ".") // ? matches any single character
    .replace(/\[([^\]]+)\]/g, "[$1]") // Character classes
    .replace(/\(([^|]+(?:\|[^|]+)*)\)/g, "($1)"); // Groups

  // Handle numeric ranges {1,3}
  regexPattern = regexPattern.replace(/\{(\d+),(\d+)\}/g, "{$1,$2}");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(branchName);
}

/**
 * Filter branches by pattern with negation support
 * @param {string[]} branches - List of branch names
 * @param {string|string[]} patterns - Pattern(s) to match
 * @returns {string[]}
 */
function filterBranches(branches, patterns) {
  if (!patterns || patterns === "all") {
    return branches;
  }

  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const includePatterns = [];
  const excludePatterns = [];

  patternList.forEach((pattern) => {
    if (pattern.startsWith("!")) {
      excludePatterns.push(pattern.slice(1));
    } else {
      includePatterns.push(pattern);
    }
  });

  return branches.filter((branch) => {
    const included =
      includePatterns.length === 0 ||
      includePatterns.some((p) => matchesPattern(branch, p));
    const excluded = excludePatterns.some((p) => matchesPattern(branch, p));

    return included && !excluded;
  });
}

/**
 * Extract project/feature from branch name
 * @param {string} branchName - Branch name
 * @returns {string|null}
 */
function extractProjectFromBranch(branchName) {
  // Common patterns: feature/PROJ-123, bugfix/PROJ-456, PROJ-789-feature
  const patterns = [
    /^feature\/([A-Z]+-\d+)/i,
    /^bugfix\/([A-Z]+-\d+)/i,
    /^([A-Z]+-\d+)/i,
    /^([a-z]+)\//i,
  ];

  for (const pattern of patterns) {
    const match = branchName.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

module.exports = {
  matchesPattern,
  filterBranches,
  extractProjectFromBranch,
};
