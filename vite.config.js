import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import { handler } from './server/api.js';

dotenv.config();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'import.meta.env.VITE_APPWRITE_ENDPOINT': JSON.stringify(env.VITE_APPWRITE_ENDPOINT || env.APPWRITE_ENDPOINT || 'https://syd.cloud.appwrite.io/v1'),
      'import.meta.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(env.VITE_APPWRITE_PROJECT_ID || env.APPWRITE_PROJECT_ID || ''),
      'import.meta.env.VITE_APPWRITE_DATABASE_ID': JSON.stringify(env.VITE_APPWRITE_DATABASE_ID || env.APPWRITE_DATABASE_ID || ''),
      'import.meta.env.VITE_APPWRITE_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_COLLECTION_ID || env.APPWRITE_COLLECTION_ID || ''),
      'import.meta.env.VITE_ADMIN_EMAIL': JSON.stringify(env.VITE_ADMIN_EMAIL || env.ADMIN_EMAIL || '')
    },
    plugins: [react(), tailwindcss(), {
      name: 'courseit-api-server',
      configureServer(server) {
        server.middlewares.use('/api', async (req, res) => {
          let body = '';
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 128 * 1024) {
              res.writeHead(413, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request is too large (128 KB limit).' }));
              return;
            }
            body += chunk;
          }
          const url = new URL(req.url, 'http://localhost');
          const result = await handler({
            httpMethod: req.method, path: '/api' + url.pathname, headers: req.headers,
            queryStringParameters: Object.fromEntries(url.searchParams), body
          });
          res.writeHead(result.statusCode, result.headers);
          res.end(result.body);
        });
      }
    }]
  };
});
