const { exec, spawn } = require("child_process");

/**
 * Safely quotes a string for use as a Git command argument value.
 * Wraps the value in double quotes and escapes any existing double quotes.
 * This prevents issues with spaces or special characters in arguments when passed to `child_process.spawn`.
 * @param {string} value - The string value to quote.
 * @returns {string} The quoted string.
 */
function quoteForGit(value) {
  // If the value contains spaces, double quotes, or backslashes, it needs quoting.
  // Git arguments can typically handle single quotes directly if not interpreted by the shell, but double quotes are safer.
  if (/[\s"\\]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Retrieves Git commits from a repository with various filtering options.
 * @param {object} options - Options for filtering commits.
 * @param {string} options.repoPath - The absolute path to the Git repository.
 * @param {string|Date} [options.since] - Optional. Filters commits made since a specific date.
 * @param {string|Date} [options.until] - Optional. Filters commits made until a specific date.
 * @param {string} [options.author] - Optional. Filters commits by author name or email (case-insensitive regex).
 * @param {string} [options.committer] - Optional. Filters commits by committer name or email (case-insensitive regex).
 * @param {string} [options.grep] - Optional. Filters commits by a keyword or regex in their commit message.
 * @param {string[]} [options.branches] - Optional. An array of specific branches or references (e.g., tags, commit hashes) to search within.
 * @param {string[]} [options.filePaths] - Optional. An array of specific file paths to filter commits by.
 * @param {number} [options.maxCount] - Optional. Limits the number of commits to output.
 * @param {number} [options.skip] - Optional. Skips the specified number of commits from the beginning of the history.
 * @param {boolean} [options.noMerges] - Optional. If true, excludes merge commits from the results.
 * @param {boolean} [options.firstParent] - Optional. If true, follows only the first parent of a merge commit.
 * @param {boolean} [options.includeFileStats] - Optional. If true, includes file change statistics (additions/deletions).
 * @param {boolean} [options.includeDiff] - Optional. If true, includes the full diff content for each commit.
 * @param {string} [options.gitPath] - Optional. The absolute path to the Git executable.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of Commit objects.
 * @throws If the provided path is not a valid Git repository, or if the git command fails to execute.
 */
function getCommits(options) {
  return new Promise((resolve, reject) => {
    const {
      repoPath,
      since,
      until,
      author,
      committer,
      grep,
      branches,
      filePaths,
      maxCount,
      skip,
      noMerges,
      firstParent,
      includeFileStats,
      includeDiff,
      gitPath,
    } = options;

    const gitExecutable = gitPath || "git";

    exec(
      `${quoteForGit(
        gitExecutable
      )} -C "${repoPath}" rev-parse --is-inside-work-tree`,
      (error, stdout, stderr) => {
        if (error || stdout.trim() !== "true") {
          return reject(
            `The provided path "${repoPath}" is not a valid Git repository. Error: ${
              stderr.trim() || error?.message
            }`
          );
        }

        let gitArgs = [
          `-C`,
          quoteForGit(repoPath),
          `log`,
          // Format: hash, author, email, date, message
          // Include commit message in format so it's captured correctly
          `--pretty=format:%H%n%an%n%ae%n%ai%n%B%n---COMMIT-END---`,
          `--decorate=full`,
        ];

        if (includeFileStats) {
          gitArgs.push(`--numstat`);
        }
        if (includeDiff) {
          gitArgs.push(`--patch`);
        }

        const formatToGitDate = (date) => {
          if (date instanceof Date) {
            return date.toISOString();
          }
          return date;
        };

        if (since) {
          gitArgs.push(`--since=${quoteForGit(formatToGitDate(since))}`);
        }
        if (until) {
          gitArgs.push(`--until=${quoteForGit(formatToGitDate(until))}`);
        }
        if (author) {
          gitArgs.push(`--author=${quoteForGit(author)}`);
        }
        if (committer) {
          gitArgs.push(`--committer=${quoteForGit(committer)}`);
        }
        if (grep) {
          gitArgs.push(`--grep=${quoteForGit(grep)}`);
        }
        if (branches && branches.length > 0) {
          gitArgs.push(...branches.map(quoteForGit));
        }
        if (maxCount !== undefined && maxCount > 0) {
          gitArgs.push(`--max-count=${maxCount}`);
        }
        if (skip !== undefined && skip >= 0) {
          gitArgs.push(`--skip=${skip}`);
        }
        if (noMerges) {
          gitArgs.push(`--no-merges`);
        }
        if (firstParent) {
          gitArgs.push(`--first-parent`);
        }

        if (filePaths && filePaths.length > 0) {
          gitArgs.push(`--`);
          gitArgs.push(...filePaths.map(quoteForGit));
        }

        const git = spawn(gitExecutable, gitArgs);

        let stdoutData = "";
        let stderrData = "";

        git.stdout.on("data", (data) => {
          stdoutData += data.toString();
        });

        git.stderr.on("data", (data) => {
          stderrData += data.toString();
        });

        git.on("close", (code) => {
          if (code !== 0) {
            console.error(`git log process exited with code ${code}`);
            return reject(
              `Failed to execute git log command. Error: ${
                stderrData.trim() || `Process exited with code ${code}`
              }`
            );
          }

          if (stderrData) {
            console.warn(`git stderr: ${stderrData}`);
          }

          const rawCommits = stdoutData
            .split("---COMMIT-END---")
            .map((c) => c.trim())
            .filter(Boolean);

          if (process.env.DEBUG) {
            console.warn(
              `DEBUG: Found ${rawCommits.length} raw commit blocks from git log`
            );
          }

          const commits = [];
          let skippedCount = 0;

          for (const rawCommit of rawCommits) {
            // Split by newline, preserving empty lines (they're important separators)
            const lines = rawCommit.split("\n");

            if (lines.length < 4) {
              skippedCount++;
              if (process.env.DEBUG) {
                console.warn(
                  `DEBUG: Skipping malformed commit ${skippedCount} - only ${lines.length} lines`
                );
                console.warn(`DEBUG: First few lines:`, lines.slice(0, 3));
              }
              continue;
            }

            // Extract the first 4 required fields (hash, author, email, date)
            // These MUST be the first 4 non-empty lines, in order
            // BUT we need to validate each field as we extract it to avoid treating numstat lines as fields
            const fields = [];
            const fieldLineIndices = [];

            // Extract and validate fields one by one
            for (let i = 0; i < lines.length && fields.length < 4; i++) {
              const trimmed = lines[i].trim();
              if (!trimmed) continue; // Skip empty lines

              // Validate based on which field we're expecting
              if (fields.length === 0) {
                // First field should be a hash (7-40 hex chars)
                if (/^[a-f0-9]{7,40}$/i.test(trimmed)) {
                  fields.push(trimmed);
                  fieldLineIndices.push(i);
                } else {
                  // Not a hash - might be a numstat line from previous commit
                  if (process.env.DEBUG) {
                    console.warn(
                      `DEBUG: Line ${i} doesn't look like a hash, skipping commit: "${trimmed.substring(
                        0,
                        50
                      )}"`
                    );
                  }
                  break; // Skip this commit block
                }
              } else if (fields.length === 3) {
                // Fourth field should be a date (starts with YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
                  fields.push(trimmed);
                  fieldLineIndices.push(i);
                } else {
                  // Not a date - might be a numstat line
                  if (process.env.DEBUG) {
                    console.warn(
                      `DEBUG: Line ${i} doesn't look like a date, skipping commit: "${trimmed.substring(
                        0,
                        50
                      )}"`
                    );
                  }
                  break; // Skip this commit block
                }
              } else {
                // Second or third field (author name/email) - accept any non-empty string
                fields.push(trimmed);
                fieldLineIndices.push(i);
              }
            }

            if (fields.length < 4) {
              skippedCount++;
              if (process.env.DEBUG) {
                console.warn(
                  `DEBUG: Skipping commit ${skippedCount} - not enough valid fields found: ${fields.length}`
                );
                console.warn(`DEBUG: Fields found:`, fields);
                console.warn(`DEBUG: First 10 lines:`, lines.slice(0, 10));
              }
              continue;
            }

            const hash = fields[0];
            const authorName = fields[1];
            const authorEmail = fields[2];
            const dateString = fields[3];
            const dateLineIndex = fieldLineIndices[3];

            // Everything after the date line is restOfLines
            const restOfLines = lines.slice(dateLineIndex + 1);

            const fileStats = [];
            let messageLines = [];
            let diffLines = [];
            let lineIndex = 0;

            // When --numstat is used, git log format is:
            // <hash>
            // <author>
            // <email>
            // <date>
            // <commit message from %B>  ← message is now in format string
            // <blank line>              ← separator after message (if numstat used)
            // <numstat line 1>          ← file stats start here (if numstat used)
            // <numstat line 2>
            // ...
            // <blank line>              ← separator before next commit
            // ---COMMIT-END---

            // First, extract the commit message (everything after date until blank line or numstat)
            // The message comes from %B in the format string, so it's in restOfLines
            if (includeFileStats && restOfLines.length > 0) {
              // When numstat is used, message comes first, then blank line, then numstat
              // Find the first blank line - everything before it is the message
              let messageEndIndex = restOfLines.length;
              for (let i = 0; i < restOfLines.length; i++) {
                if (restOfLines[i].trim() === "") {
                  messageEndIndex = i;
                  break;
                }
              }

              // Extract message (everything before first blank line)
              messageLines = restOfLines.slice(0, messageEndIndex);

              // Skip the blank line separator
              lineIndex = messageEndIndex + 1;

              // Process numstat lines after the message
              while (lineIndex < restOfLines.length) {
                const line = restOfLines[lineIndex];

                // Stop if we hit a blank line (separator before next commit)
                if (line.trim() === "") {
                  break;
                }

                // Numstat format: <additions> <deletions> <filepath>
                // Uses spaces (not tabs) for alignment, e.g., "17       0       src/file.js"
                // Match: optional spaces, number or dash, multiple spaces, number or dash, spaces, filepath
                const statMatch = line.match(/^\s*(\d+|-)\s+(\d+|-)\s+(.+)$/);
                if (statMatch) {
                  const additions =
                    statMatch[1] === "-" ? 0 : parseInt(statMatch[1], 10);
                  const deletions =
                    statMatch[2] === "-" ? 0 : parseInt(statMatch[2], 10);
                  const filePath = statMatch[3].trim();
                  fileStats.push({ filePath, additions, deletions });
                  lineIndex++;
                } else {
                  // Not a numstat line, stop processing
                  break;
                }
              }
            } else {
              // No numstat - message is everything in restOfLines
              messageLines = restOfLines.filter((line) => {
                // Skip diff lines if includeDiff is false
                if (includeDiff && line.startsWith("diff --git")) {
                  diffLines.push(line);
                  return false;
                }
                return true;
              });
            }

            // Handle diff separately if needed
            if (includeDiff) {
              for (let i = lineIndex; i < restOfLines.length; i++) {
                const line = restOfLines[i];
                if (line.startsWith("diff --git")) {
                  diffLines.push(line);
                  // Process remaining lines as diff
                  for (let j = i + 1; j < restOfLines.length; j++) {
                    diffLines.push(restOfLines[j]);
                  }
                  break;
                }
              }
            }

            const message = messageLines.join("\n").trim();
            const diff = diffLines.join("\n").trim();

            // Validate and parse date
            if (!dateString || dateString.trim() === "") {
              console.warn(
                `Warning: Empty date string for commit ${hash.substring(
                  0,
                  7
                )}, skipping`
              );
              continue;
            }

            const commitDate = new Date(dateString.trim());
            if (isNaN(commitDate.getTime())) {
              console.warn(
                `Warning: Invalid date string "${dateString}" for commit ${hash.substring(
                  0,
                  7
                )}, skipping`
              );
              continue;
            }

            const decorateMatch = rawCommit.match(/\((.*?)\)/);
            const branchesStr = decorateMatch ? decorateMatch[1] : "";
            const branchesArray = branchesStr
              .split(", ")
              .filter(
                (b) => b.startsWith("HEAD ->") || b.startsWith("refs/heads/")
              )
              .map((b) => b.replace(/(HEAD -> |refs\/heads\/)/, "").trim());

            commits.push({
              hash,
              authorName,
              authorEmail,
              date: commitDate,
              message,
              branches: branchesArray,
              ...(includeFileStats && { fileStats }),
              ...(includeDiff && { diff }),
            });
          }

          if (process.env.DEBUG) {
            console.warn(
              `DEBUG: Parsed ${commits.length} valid commits, skipped ${skippedCount} invalid commits`
            );
          }

          resolve(commits);
        });

        git.on("error", (err) => {
          console.error("Failed to start git process.", err);
          reject(`Failed to start git process: ${err.message}`);
        });
      }
    );
  });
}

module.exports = { getCommits, quoteForGit };
