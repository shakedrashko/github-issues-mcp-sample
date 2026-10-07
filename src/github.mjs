const API_ROOT = 'https://api.github.com';
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

export function validateRepository(owner, repo) {
  if (!NAME.test(owner) || !NAME.test(repo) || owner === '.' || owner === '..' || repo === '.' || repo === '..') {
    throw new Error('owner and repo must be GitHub repository path segments');
  }
}

export async function githubGet(path, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const token = options.token ?? process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'github-issues-mcp-sample/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(`${API_ROOT}${path}`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const message = response.status === 404
      ? 'Repository or issue not found'
      : response.status === 403 || response.status === 429
        ? 'GitHub API rate limit or access restriction'
        : `GitHub API returned HTTP ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

export async function listIssues({ owner, repo, state = 'open', label, limit = 10, page = 1 }, options = {}) {
  validateRepository(owner, repo);
  const search = new URLSearchParams({ state, per_page: String(limit), page: String(page) });
  if (label) search.set('labels', label);
  const issues = await githubGet(`/repos/${owner}/${repo}/issues?${search}`, options);
  if (!Array.isArray(issues)) throw new Error('Unexpected GitHub API response');
  return issues.filter(issue => !issue.pull_request).map(issue => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.html_url,
    updated_at: issue.updated_at,
    labels: (issue.labels ?? []).map(item => typeof item === 'string' ? item : item.name),
  }));
}

export async function getIssue({ owner, repo, number }, options = {}) {
  validateRepository(owner, repo);
  const issue = await githubGet(`/repos/${owner}/${repo}/issues/${number}`, options);
  if (issue.pull_request) throw new Error('This number identifies a pull request, not an issue');
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.html_url,
    body: issue.body,
    updated_at: issue.updated_at,
    labels: (issue.labels ?? []).map(item => typeof item === 'string' ? item : item.name),
  };
}

export async function listLabels({ owner, repo, limit = 30 }, options = {}) {
  validateRepository(owner, repo);
  const labels = await githubGet(`/repos/${owner}/${repo}/labels?per_page=${limit}`, options);
  if (!Array.isArray(labels)) throw new Error('Unexpected GitHub API response');
  return labels.map(label => ({ name: label.name, description: label.description, color: label.color }));
}

