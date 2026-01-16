const TimesheetGenerator = require("./TimesheetGenerator");
const { deduplicateCommits, sortCommitsByDate } = require("../utils/commitUtils");

/**
 * Multi-Repo Timesheet Generator - aggregates commits from multiple repositories
 */
class MultiRepoTimesheetGenerator extends TimesheetGenerator {
  /**
   * Generate timesheet from multiple repositories with parallel processing
   */
  async generateFromRepos(adapters, options = {}) {
    const allCommits = [];
    const concurrencyLimit = options.concurrencyLimit || 5;

    // Process adapters in parallel with concurrency limit
    const processAdapter = async (adapter) => {
      try {
        const repoInfo = await adapter.getRepoInfo();
        const commits = await adapter.getCommits(options);

        // Add repo metadata
        commits.forEach((commit) => {
          commit.repo = repoInfo.name || repoInfo.path;
          commit.repoType = repoInfo.type;
        });

        return { commits, repoInfo, error: null };
      } catch (error) {
        return {
          commits: [],
          repoInfo: { name: 'unknown', path: 'unknown' },
          error: error.message,
        };
      }
    };

    // Process adapters in batches
    const results = [];
    for (let i = 0; i < adapters.length; i += concurrencyLimit) {
      const batch = adapters.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.allSettled(
        batch.map(adapter => processAdapter(adapter))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { commits, repoInfo, error } = result.value;
          if (error) {
            console.warn(`Warning: Failed to fetch from ${repoInfo.name || repoInfo.path}: ${error}`);
          } else {
            results.push({ commits, repoInfo });
          }
        } else {
          console.warn(`Warning: Failed to process adapter: ${result.reason}`);
        }
      });
    }

    // Collect all commits
    results.forEach(({ commits }) => {
      allCommits.push(...commits);
    });

    // Deduplicate and sort
    let processedCommits = deduplicateCommits(allCommits);
    processedCommits = sortCommitsByDate(processedCommits);

    // Generate timesheet using parent class
    return super.generate(processedCommits, options);
  }
}

module.exports = MultiRepoTimesheetGenerator;

