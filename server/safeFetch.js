import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import ipaddr from 'ipaddr.js';

const MAX_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'CourseIT/1.13 (+https://courseitai.kenncode.me)';

function inputError(message) {
  return Object.assign(new Error(message), { status: 422 });
}

export function isPublicAddress(address) {
  try { return ipaddr.process(address).range() === 'unicast'; }
  catch { return false; }
}

export function validateDocumentUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw inputError('Enter a full HTTP or HTTPS documentation URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))) {
    throw inputError('Use a public HTTP or HTTPS documentation URL on a standard port.');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw inputError('Use a public documentation host.');
  }
  if (net.isIP(hostname) && !isPublicAddress(hostname)) throw inputError('Use a public documentation host.');
  url.hash = '';
  return url;
}

async function resolvePublicHost(url, resolveHost) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(hostname)
    ? [{ address: hostname, family: net.isIP(hostname) }]
    : await resolveHost(hostname, { all: true });
  if (!addresses?.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw inputError('The documentation host does not resolve to a public address.');
  }
  return addresses[0];
}

export async function fetchDocumentHtml(raw, { resolveHost = lookup, request = null } = {}) {
  let url = validateDocumentUrl(raw);
  const deadline = Date.now() + 10000;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const address = await resolvePublicHost(url, resolveHost);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw Object.assign(new Error('Documentation fetch timed out.'), { name: 'TimeoutError' });
    const transport = request || (url.protocol === 'https:' ? https.request : http.request);
    const response = await new Promise((resolve, reject) => {
      const req = transport(url, {
        method: 'GET', signal: AbortSignal.timeout(remaining),
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' }
      }, res => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          res.resume();
          resolve({ redirect: res.headers.location });
          return;
        }
        if (status < 200 || status >= 300) {
          res.resume();
          reject(inputError(`Could not fetch documentation (HTTP ${status}).`));
          return;
        }
        if (!/^\s*(text\/html|application\/xhtml\+xml)(?:\s*;|\s*$)/i.test(res.headers['content-type'] || '')) {
          res.resume();
          reject(inputError('The URL did not return an HTML document.'));
          return;
        }
        let bytes = 0;
        const chunks = [];
        res.on('data', chunk => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) {
            req.destroy(inputError('The documentation page is too large (1 MB limit).'));
          } else chunks.push(chunk);
        });
        res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });
    if (response.html !== undefined) return { html: response.html, url: url.href };
    if (!response.redirect || redirects === MAX_REDIRECTS) throw inputError('The documentation page redirected too many times.');
    url = validateDocumentUrl(new URL(response.redirect, url).href);
  }
  throw inputError('The documentation page redirected too many times.');
}
