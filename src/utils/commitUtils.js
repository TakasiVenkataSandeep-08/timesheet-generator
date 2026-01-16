/**
 * Normalize commit object to standard format
 * Returns null if commit is invalid (will be filtered out)
 */
function normalizeCommit(commit) {
  if (!commit || !commit.hash) {
    if (process.env.DEBUG) {
      console.warn(`DEBUG normalizeCommit: Skipping commit - missing commit or hash`);
    }
    return null; // Invalid commit, skip
  }

  let date;
  if (commit.date instanceof Date) {
    date = commit.date;
  } else if (typeof commit.date === 'string' || typeof commit.date === 'number') {
    date = new Date(commit.date);
  } else {
    // Try to parse as string if it's not a recognized type
    date = new Date(String(commit.date));
  }

  // Validate date - if still invalid, return null (will be filtered out)
  if (isNaN(date.getTime())) {
    if (process.env.DEBUG) {
      console.warn(`DEBUG normalizeCommit: Skipping commit ${commit.hash.substring(0, 7)} - invalid date: ${commit.date} (parsed as: ${date})`);
    }
    return null; // Invalid date, skip this commit
  }

  return {
    hash: commit.hash,
    authorName: commit.authorName || "",
    authorEmail: commit.authorEmail || "",
    date: date,
    message: commit.message || "",
    branches: commit.branches || [],
    fileStats: commit.fileStats || [],
    diff: commit.diff || null,
    // Preserve repository information if present
    repo: commit.repo || null,
    repoType: commit.repoType || null,
  };
}

/**
 * Sort commits by date (newest first)
 */
function sortCommitsByDate(commits) {
  return [...commits].sort((a, b) => b.date - a.date);
}

/**
 * Deduplicate commits by hash
 */
function deduplicateCommits(commits) {
  const seen = new Set();
  return commits.filter((commit) => {
    if (seen.has(commit.hash)) {
      return false;
    }
    seen.add(commit.hash);
    return true;
  });
}

module.exports = {
  normalizeCommit,
  sortCommitsByDate,
  deduplicateCommits,
};

