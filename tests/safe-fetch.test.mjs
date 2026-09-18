import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { fetchDocumentHtml, isPublicAddress, validateDocumentUrl } from '../server/safeFetch.js';

function fakeRequest(responses) {
  const calls = [];
  const request = (url, options, callback) => {
    calls.push({ url: url.href, options });
    const req = new EventEmitter();
    req.end = () => queueMicrotask(() => {
      const response = responses.shift();
      const stream = new PassThrough();
      stream.statusCode = response.status;
      stream.headers = response.headers || {};
      callback(stream);
      stream.end(response.body || '');
    });
    req.destroy = error => req.emit('error', error);
    return req;
  };
  return { request, calls };
}

test('URL policy rejects local, private, credentialed and nonstandard destinations', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', 'fc00::1', '::ffff:127.0.0.1']) {
    assert.equal(isPublicAddress(address), false, address);
  }
  for (const url of ['http://localhost/', 'http://127.0.0.1/', 'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/', 'http://example.com:8080/', 'https://user:pass@example.com/']) {
    assert.throws(() => validateDocumentUrl(url), { status: 422 }, url);
  }
  assert.equal(validateDocumentUrl('https://example.com/docs#top').href, 'https://example.com/docs');
});

test('DNS and redirects are checked before each request, with vetted address pinned', async () => {
  const { request, calls } = fakeRequest([{ status: 302, headers: { location: 'http://internal.test/admin' } }]);
  await assert.rejects(fetchDocumentHtml('https://docs.example.com/start', {
    resolveHost: async host => [{ address: host === 'docs.example.com' ? '93.184.215.14' : '10.0.0.2', family: 4 }], request
  }), { status: 422 });
  assert.equal(calls.length, 1);
  await new Promise((resolve, reject) => calls[0].options.lookup('docs.example.com', {}, (error, address) => {
    if (error) reject(error);
    else { assert.equal(address, '93.184.215.14'); resolve(); }
  }));
  await new Promise((resolve, reject) => calls[0].options.lookup('docs.example.com', { all: true }, (error, addresses) => {
    if (error) reject(error);
    else { assert.deepEqual(addresses, [{ address: '93.184.215.14', family: 4 }]); resolve(); }
  }));
});

test('public HTML succeeds but binary and oversized responses fail', async () => {
  const resolveHost = async () => [{ address: '93.184.215.14', family: 4 }];
  const html = fakeRequest([{ status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, body: '<h1>Docs</h1>' }]);
  assert.equal((await fetchDocumentHtml('https://docs.example.com/', { resolveHost, request: html.request })).html, '<h1>Docs</h1>');
  const binary = fakeRequest([{ status: 200, headers: { 'content-type': 'application/pdf' }, body: 'PDF' }]);
  await assert.rejects(fetchDocumentHtml('https://docs.example.com/', { resolveHost, request: binary.request }), { status: 422 });
  const oversized = fakeRequest([{ status: 200, headers: { 'content-type': 'text/html' }, body: 'x'.repeat(1024 * 1024 + 1) }]);
  await assert.rejects(fetchDocumentHtml('https://docs.example.com/', { resolveHost, request: oversized.request }), { status: 422 });
});
