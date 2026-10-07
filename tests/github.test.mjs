import test from 'node:test';
import assert from 'node:assert/strict';
import { getIssue, listIssues, listLabels } from '../src/github.mjs';

function fakeFetch(body, status = 200) {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { fetchImpl, seen };
}

test('listIssues filters pull requests and sends bounded query', async () => {
  const api = fakeFetch([
    { number: 7, title: 'Issue', state: 'open', html_url: 'https://github.com/a/b/issues/7', updated_at: '2026-10-07', labels: [{ name: 'bug' }] },
    { number: 8, title: 'PR', pull_request: {}, labels: [] },
  ]);
  const result = await listIssues({ owner: 'a', repo: 'b', state: 'open', label: 'bug', limit: 5, page: 2 }, api);
  assert.deepEqual(result.map(issue => issue.number), [7]);
  assert.equal(result[0].labels[0], 'bug');
  assert.match(api.seen[0].url, /\/repos\/a\/b\/issues\?state=open&per_page=5&page=2&labels=bug/);
});

test('getIssue rejects pull requests and reports missing issues', async () => {
  await assert.rejects(getIssue({ owner: 'a', repo: 'b', number: 8 }, fakeFetch({ pull_request: {} })), /pull request/);
  await assert.rejects(getIssue({ owner: 'a', repo: 'b', number: 9 }, fakeFetch({}, 404)), /not found/);
});

test('listLabels rejects invalid repository path before making a request', async () => {
  const api = fakeFetch([]);
  await assert.rejects(listLabels({ owner: '../x', repo: 'b' }, api), /path segments/);
  await assert.rejects(listLabels({ owner: '..', repo: 'b' }, api), /path segments/);
  assert.equal(api.seen.length, 0);
});

