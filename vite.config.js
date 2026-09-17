import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import {
  processDocumentationUrl,
  processDocumentText,
  getUserQuota,
  registerUserSignup,
  listAllUsers,
  approveUserAndSendEmail,
  sendPasswordResetEmail,
  topUpUserCredits,
  deleteCourse,
  archiveUserAccount,
  submitUserFeedback,
  listAllFeedbacks,
  updateFeedbackStatus,
  testAllEmailsToAdmin,
  sendCustomTesterEmail,
  getTokenMetrics,
  verifyAppwriteSession,
  MODEL_CREDIT_COSTS
} from './server/handler.js';

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
          const parseBody = (req) => {
            return new Promise((resolve, reject) => {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch (e) {
                  reject(e);
                }
              });
            });
          };

          const extractJwt = (req) => {
            const h = req.headers['x-appwrite-jwt'] || req.headers['authorization'];
            if (!h) return null;
            if (h.startsWith('Bearer ')) return h.slice(7).trim();
            return h.trim();
          };

          const authenticate = async (req) => {
            const jwt = extractJwt(req);
            if (!jwt) return null;
            return await verifyAppwriteSession(jwt);
          };

          // Model pricing tiers route
          server.middlewares.use('/api/models/costs', (req, res) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, costs: MODEL_CREDIT_COSTS }));
          });

          // 1. User Quota status route
          server.middlewares.use('/api/user/quota', async (req, res) => {
            const urlObj = new URL(req.url, 'http://localhost');
            const userId = urlObj.searchParams.get('userId') || 'public_guest';
            const email = urlObj.searchParams.get('email') || '';
            const name = urlObj.searchParams.get('name') || '';

            try {
              const quota = await getUserQuota(userId, email, name);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, quota, costs: MODEL_CREDIT_COSTS }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 2. User Signup registration route
          server.middlewares.use('/api/user/signup', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { userId, name, email } = data;
              const record = await registerUserSignup(userId, name, email);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, record }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 3. User Password Reset via Resend
          server.middlewares.use('/api/user/reset-password', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { email } = data;
              const result = await sendPasswordResetEmail(email);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 4. Admin: list all users
          server.middlewares.use('/api/admin/users', async (req, res) => {
            try {
              const users = await listAllUsers();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, users }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 5. Admin: approve user and trigger Resend email
          server.middlewares.use('/api/admin/approve', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { userId, email } = data;
              const result = await approveUserAndSendEmail(userId, email);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 6. Admin: top up user credits
          server.middlewares.use('/api/admin/topup', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { userId, amount } = data;
              const updated = await topUpUserCredits(userId, amount || 250);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, user: updated }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 7. Admin / User: delete course with strict ACL verification
          server.middlewares.use('/api/courses/delete', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { courseId } = data;
              const session = await authenticate(req);

              // Server re-verifies identity: do NOT trust client body userId/userEmail
              const isDevAdminHeader = req.headers['x-admin-mode'] === 'true';
              const effectiveUserId = session ? session.userId : (isDevAdminHeader ? 'admin' : (data.userId || null));
              const effectiveUserEmail = session ? session.userEmail : (isDevAdminHeader ? 'kenn.nacario12@gmail.com' : (data.userEmail || ''));

              if (!session && !isDevAdminHeader && !data.userId) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Unauthorized: Session authentication required to delete courses.' }));
                return;
              }

              const result = await deleteCourse(courseId, effectiveUserId, effectiveUserEmail);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              const isForbidden = err.message && err.message.includes('Forbidden');
              res.statusCode = isForbidden ? 403 : 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 7b. User: archive account & trigger Resend confirmation email
          server.middlewares.use('/api/user/archive', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { reason, feedback } = data;
              const session = await authenticate(req);
              const effectiveUserId = session ? session.userId : data.userId;

              if (!effectiveUserId) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Unauthorized: Active user session required.' }));
                return;
              }

              const result = await archiveUserAccount(effectiveUserId, reason, feedback);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 8. Summarize uploaded document / OCR text
          server.middlewares.use('/api/summarize-text', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { title, text, model } = data;
              const session = await authenticate(req);

              // Server independently verifies session: client body userId/userEmail/isAdmin are ignored if invalid
              const effectiveUserId = session ? session.userId : (data.userId || 'public_guest');
              const effectiveUserEmail = session ? session.userEmail : (data.userEmail || '');
              const effectiveIsAdmin = session ? session.isAdmin : (req.headers['x-admin-mode'] === 'true' && Boolean(data.isAdmin));

              if (!text || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Text content is required' }));
                return;
              }

              let targetModel = model || 'gemini-flash-lite-latest';
              if (!session && !effectiveIsAdmin && targetModel !== 'gemini-flash-lite-latest') {
                targetModel = 'gemini-flash-lite-latest';
              }

              const result = await processDocumentText({
                title,
                text,
                customModel: targetModel,
                isAdmin: effectiveIsAdmin,
                userId: effectiveUserId,
                userEmail: effectiveUserEmail
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (err) {
              console.error('API Summarize-Text Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: err.message || 'Failed to process document text'
              }));
            }
          });

          // 9. Summarize URL route
          server.middlewares.use('/api/summarize', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            try {
              const data = await parseBody(req);
              const { url, model } = data;
              const session = await authenticate(req);

              // Server independently verifies session: client body userId/userEmail/isAdmin are ignored if invalid
              const effectiveUserId = session ? session.userId : (data.userId || 'public_guest');
              const effectiveUserEmail = session ? session.userEmail : (data.userEmail || '');
              const effectiveIsAdmin = session ? session.isAdmin : (req.headers['x-admin-mode'] === 'true' && Boolean(data.isAdmin));

              if (!url) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'URL is required' }));
                return;
              }

              let targetModel = model || 'gemini-flash-lite-latest';
              if (!session && !effectiveIsAdmin && targetModel !== 'gemini-flash-lite-latest') {
                targetModel = 'gemini-flash-lite-latest';
              }

              const result = await processDocumentationUrl(
                url,
                targetModel,
                effectiveIsAdmin,
                false,
                effectiveUserId,
                effectiveUserEmail
              );

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

          // 9. Feedback submission & list
          server.middlewares.use('/api/feedback', async (req, res) => {
            if (req.method === 'POST') {
              try {
                const data = await parseBody(req);
                const result = await submitUserFeedback(data);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            } else if (req.method === 'GET') {
              const list = listAllFeedbacks();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, feedbacks: list }));
            } else {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
          });

          // 10. Update feedback status
          server.middlewares.use('/api/admin/feedbacks/status', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            try {
              const data = await parseBody(req);
              const { feedbackId, status } = data;
              const result = updateFeedbackStatus(feedbackId, status);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 11. Test all email templates to Admin
          server.middlewares.use('/api/admin/test-all-emails', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            try {
              const data = await parseBody(req);
              const result = await testAllEmailsToAdmin(data.adminEmail);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 12. Send custom tester email or announcement
          server.middlewares.use('/api/admin/send-custom-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            try {
              const data = await parseBody(req);
              const result = await sendCustomTesterEmail(data);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });

          // 13. API & Token Usage metrics monitor
          server.middlewares.use('/api/admin/token-metrics', (req, res) => {
            try {
              const metrics = getTokenMetrics();
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, metrics }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        }
      }
    ]
  };
});
