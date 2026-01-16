/**
 * Check if branch name matches pattern
 * @param {string} branchName - Branch name
 * @param {string} pattern - Pattern (e.g., "feature/*", "bugfix/*")
 * @returns {boolean}
 */
function matchesPattern(branchName, pattern) {
  if (!pattern || pattern === "all") {
    return true;
  }

  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`);

  return regex.test(branchName);
}

/**
 * Filter branches by pattern
 * @param {string[]} branches - List of branch names
 * @param {string|string[]} pattern - Pattern(s) to match
 * @returns {string[]}
 */
function filterBranches(branches, pattern) {
  if (!pattern || pattern === "all") {
    return branches;
  }

  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  return branches.filter((branch) =>
    patterns.some((p) => matchesPattern(branch, p))
  );
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

