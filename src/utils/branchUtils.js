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

  // Simple glob pattern matching for essential branch patterns
  // Convert glob to regex step by step
  let regexStr = "^";

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (char === "*") {
      // Check if this is **
      if (i + 1 < pattern.length && pattern[i + 1] === "*") {
        regexStr += ".*"; // ** matches any characters including /
        i++; // Skip next *
      } else {
        regexStr += "[^/]*"; // * matches any characters except /
      }
    } else if (char === "?") {
      regexStr += "."; // ? matches single character
    } else {
      // Escape special regex characters
      if ("[.+^${}()|]".includes(char)) {
        regexStr += "\\" + char;
      } else {
        regexStr += char;
      }
    }
  }

  regexStr += "$";

  try {
    const regex = new RegExp(regexStr);
    return regex.test(branchName);
  } catch (error) {
    // If regex is invalid, fall back to simple string matching
    console.warn(
      `Invalid regex pattern "${regexStr}" for "${pattern}", falling back to string match`,
    );
    return branchName === pattern;
  }
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

  // Only return branch name for very common simple branch names
  const commonBranches = [
    "main",
    "master",
    "develop",
    "dev",
    "test",
    "staging",
    "production",
    "prod",
  ];
  if (commonBranches.includes(branchName)) {
    return branchName;
  }

  return null;
}

module.exports = {
  matchesPattern,
  filterBranches,
  extractProjectFromBranch,
};
