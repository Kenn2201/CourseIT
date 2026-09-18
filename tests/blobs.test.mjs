import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';
import { getStore, setEnvironmentContext } from '@netlify/blobs';
import { writeState, readState, updateState, listState, deleteState } from '../server/state.js';

test('Netlify function storage persists records and rejects concurrent overspending', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'courseit-blobs-'));
  const server = new BlobsServer({ directory, token: 'test-token' });
  const address = await server.start();
  const originalFetch = globalThis.fetch;
  const etags = new Map();
  // The SDK's local server omits ETag on GET although production returns it.
  // Restore the real ETag returned by PUT; writes and conditional checks still
  // go through the unmodified SDK server, not a mocked success response.
  globalThis.fetch = async (input, options) => {
    const response = await originalFetch(input, options);
    const url = new URL(input instanceof Request ? input.url : input);
    const key = url.origin + url.pathname;
    const method = (options?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method === 'PUT' && response.ok && response.headers.has('etag')) {
      etags.set(key, response.headers.get('etag'));
    }
    if (method === 'GET' && response.ok && etags.has(key) && !response.headers.has('etag')) {
      const headers = new Headers(response.headers);
      headers.set('etag', etags.get(key));
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  };
  const previous = process.env.NETLIFY;
  process.env.NETLIFY = 'true';
  try {
    setEnvironmentContext({ siteID: 'test-site', deployID: 'test-deploy', token: 'test-token',
      edgeURL: 'http://127.0.0.1:' + address.port, uncachedEdgeURL: 'http://127.0.0.1:' + address.port });
    await writeState('users/test', { quota_remaining: 0.5 });
    assert.equal((await readState('users/test')).quota_remaining, 0.5);
    const deduct = () => updateState('users/test', value => {
      if (value.quota_remaining < 0.5) throw new Error('Insufficient credits');
      return { quota_remaining: value.quota_remaining - 0.5 };
    });
    const attempts = await Promise.allSettled([deduct(), deduct()]);
    assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1,
      attempts.map(r => r.reason?.message || 'fulfilled').join('; '));
    assert.equal((await readState('users/test')).quota_remaining, 0);
    assert.equal((await listState('users/')).length, 1);
    const blobs = getStore({ name: 'courseit-state', consistency: 'strong' });
    const staleWrite = await blobs.setJSON('users/test', { quota_remaining: 100 }, { onlyIfMatch: 'stale-version' });
    assert.equal(staleWrite.modified, false);
    assert.equal((await readState('users/test')).quota_remaining, 0);
    await deleteState('users/test');
    assert.equal(await readState('users/test'), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) delete process.env.NETLIFY; else process.env.NETLIFY = previous;
    await server.stop();
    await rm(directory, { recursive: true, force: true });
  }
});
