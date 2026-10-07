import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createServer } from '../src/server.mjs';

test('MCP client discovers three tools and rejects invalid arguments', async () => {
  const server = createServer();
  const client = new Client({ name: 'sample-test-client', version: '1.0.0' });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['get_issue', 'list_issues', 'list_labels']);
    const invalid = await client.callTool({ name: 'get_issue', arguments: { owner: '../bad', repo: 'test', number: 1 } });
    assert.equal(invalid.isError, true);
    assert.match(invalid.content[0].text, /Invalid arguments|validation/i);
  } finally {
    await client.close();
    await server.close();
  }
});

