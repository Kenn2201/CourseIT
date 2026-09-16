import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import { processDocumentationUrl } from './server/handler.js';

dotenv.config();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'courseit-api-server',
        configureServer(server) {
          server.middlewares.use('/api/summarize', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}');
                const { url, model } = data;

                if (!url) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'URL is required' }));
                  return;
                }

                const result = await processDocumentationUrl(url, model);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, ...result }));
              } catch (err) {
                console.error('API Summarize Error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: err.message || 'Failed to process documentation URL'
                }));
              }
            });
          });
        }
      }
    ]
  };
});
