import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { getIssue, listIssues, listLabels } from './github.mjs';

const repository = {
  owner: z.string().min(1).max(100).regex(/^[A-Za-z0-9_.-]+$/),
  repo: z.string().min(1).max(100).regex(/^[A-Za-z0-9_.-]+$/),
};

function result(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

function failure(error) {
  return { content: [{ type: 'text', text: error instanceof Error ? error.message : 'Unknown error' }], isError: true };
}

export function createServer() {
  const server = new McpServer({ name: 'github-issues-readonly', version: '1.0.0' });
  server.registerTool('list_issues', {
    description: 'List issue summaries from one public GitHub repository; excludes pull requests. Returns one page.',
    inputSchema: z.object({
      ...repository,
      state: z.enum(['open', 'closed', 'all']).default('open'),
      label: z.string().min(1).optional(),
      limit: z.number().int().min(1).max(30).default(10),
      page: z.number().int().min(1).max(100).default(1),
    }),
  }, async (input) => {
    try { return result(await listIssues(input)); } catch (error) { return failure(error); }
  });
  server.registerTool('get_issue', {
    description: 'Get an issue and its description from one public GitHub repository.',
    inputSchema: z.object({ ...repository, number: z.number().int().positive() }),
  }, async (input) => {
    try { return result(await getIssue(input)); } catch (error) { return failure(error); }
  });
  server.registerTool('list_labels', {
    description: 'List label names and descriptions from one public GitHub repository.',
    inputSchema: z.object({ ...repository, limit: z.number().int().min(1).max(100).default(30) }),
  }, async (input) => {
    try { return result(await listLabels(input)); } catch (error) { return failure(error); }
  });
  return server;
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  void serveStdio(createServer);
  console.error('github-issues-readonly MCP server ready on stdio');
}

