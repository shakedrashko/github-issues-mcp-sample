# GitHub Issues MCP sample

A small, read-only Model Context Protocol server exposing three tools over the public GitHub Issues API: `list_issues`, `get_issue`, and `list_labels`. It demonstrates input validation, bounded pagination, upstream error handling, and a local stdio transport. This is a self-created sample, not client work.

## Run

Requires Node.js 20 or newer.

```sh
npm install
npm start
```

The server waits for an MCP client on stdin. In a client that accepts a local command, use `node /absolute/path/to/github-issues-mcp/src/server.mjs` as the command. Set `GITHUB_TOKEN` in the client process environment only if higher GitHub API limits are needed; public repositories work without a token. Do not put a token in the tool arguments.

Example tool input:

```json
{"owner":"modelcontextprotocol","repo":"typescript-sdk","limit":5}
```

`list_issues` returns one page of issue summaries and excludes pull requests. `get_issue` fetches the body for a specific issue. `list_labels` provides available label filters. All tools are read-only. GitHub's REST API may enforce rate limits, which the tools return as an error instead of retrying indefinitely.

## Verify

```sh
npm test
```

The tests use mock responses to check filtering and upstream failures, then start an in-memory MCP client to verify tool discovery and schema validation. A live GitHub call can be used as a separate integration check when connectivity allows.

