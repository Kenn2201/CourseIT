import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { JSDOM } from 'jsdom';

for (const configured of [true, false]) {
  test(`production auth/catalog startup with Appwrite ${configured ? 'configured' : 'unconfigured'}`, async () => {
    // Use Vite/Rollup and execute the minified output, not just compile it.
    // Catalog-first import order reproduces the production circular-import crash.
    const result = await build({
      configFile: false, logLevel: 'silent',
      envFile: false,
      define: {
        'import.meta.env.VITE_APPWRITE_ENDPOINT': JSON.stringify('https://auth.example.test/v1'),
        'import.meta.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(configured ? 'startup-test-project' : ''),
        'import.meta.env.VITE_APPWRITE_DATABASE_ID': JSON.stringify(''),
        'import.meta.env.VITE_APPWRITE_COLLECTION_ID': JSON.stringify('')
      },
      plugins: [{ name: 'startup-fixture',
        resolveId(id) { if (id === 'startup-fixture') return '\0startup-fixture'; },
        load(id) { if (id === '\0startup-fixture') return `
          import { client, isAppwriteConfigured } from '/src/lib/appwrite.js';
          import { ensureAccount } from '/src/lib/auth.js';
          window.startupResult = { client, account: ensureAccount(), configured: isAppwriteConfigured() };
        `; }
      }],
      build: { write: false, minify: true, rollupOptions: {
        input: 'startup-fixture', output: { format: 'iife' }
      } }
    });
    const browser = new JSDOM('<!doctype html><div id="root"></div>', {
      url: 'https://courseit.example.test', runScripts: 'outside-only'
    });
    try {
      const script = result.output.find(item => item.type === 'chunk').code;
      assert.doesNotThrow(() => browser.window.eval(script));
      assert.equal(browser.window.startupResult.configured, configured);
      assert.equal(Boolean(browser.window.startupResult.client), configured);
      assert.equal(Boolean(browser.window.startupResult.account), configured);
      if (configured) assert.equal(browser.window.startupResult.account.client, browser.window.startupResult.client);
    } finally { browser.window.close(); }
  });
}
