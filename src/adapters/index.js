const LocalGitAdapter = require("./LocalGitAdapter");
const GitHubAdapter = require("./GitHubAdapter");
const GitLabAdapter = require("./GitLabAdapter");

/**
 * Adapter registry
 */
const adapters = {
  local: LocalGitAdapter,
  git: LocalGitAdapter,
  github: GitHubAdapter,
  gitlab: GitLabAdapter,
};

/**
 * Get adapter by name
 */
function getAdapter(name, options = {}) {
  const AdapterClass = adapters[name.toLowerCase()];
  if (!AdapterClass) {
    throw new Error(`Unknown adapter: ${name}. Available: ${Object.keys(adapters).join(", ")}`);
  }
  return new AdapterClass(options);
}

/**
 * Create adapter from URL or path
 */
function createAdapterFromUrl(urlOrPath, options = {}) {
  // GitHub URL: https://github.com/owner/repo or github.com/owner/repo
  const githubMatch = urlOrPath.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/);
  if (githubMatch) {
    return new GitHubAdapter({
      owner: githubMatch[1],
      repo: githubMatch[2].replace(/\.git$/, ""),
      token: options.token || process.env.GITHUB_TOKEN,
    });
  }

  // GitLab URL: https://gitlab.com/owner/repo or gitlab.com/owner/repo
  const gitlabMatch = urlOrPath.match(/(?:https?:\/\/)?(?:www\.)?gitlab\.com\/([^\/]+)\/([^\/]+)/);
  if (gitlabMatch) {
    // GitLab uses project path, not just owner/repo
    const projectPath = `${gitlabMatch[1]}/${gitlabMatch[2]}`.replace(/\.git$/, "");
    return new GitLabAdapter({
      projectId: projectPath,
      token: options.token || process.env.GITLAB_TOKEN,
      baseUrl: options.baseUrl || "https://gitlab.com",
    });
  }

  // Default to local git
  return new LocalGitAdapter(urlOrPath);
}

/**
 * List available adapters
 */
function listAdapters() {
  return Object.keys(adapters);
}

module.exports = {
  getAdapter,
  createAdapterFromUrl,
  listAdapters,
  adapters,
};

