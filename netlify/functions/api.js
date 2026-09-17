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
} from '../../server/handler.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Appwrite-JWT, x-appwrite-jwt, x-admin-mode',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body)
});

const extractJwt = (headers) => {
  const h = headers['x-appwrite-jwt'] || headers['X-Appwrite-JWT'] || headers['authorization'] || headers['Authorization'];
  if (!h) return null;
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return h.trim();
};

const authenticate = async (headers) => {
  const jwt = extractJwt(headers);
  if (!jwt) return null;
  return await verifyAppwriteSession(jwt);
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  // Normalize subpath (e.g. /.netlify/functions/api/summarize -> /summarize, /api/summarize -> /summarize)
  let subpath = event.path || '';
  subpath = subpath.replace(/^\/\.netlify\/functions\/api/, '').replace(/^\/api/, '');
  if (!subpath.startsWith('/')) subpath = '/' + subpath;

  // Strip trailing slash if present
  if (subpath.length > 1 && subpath.endsWith('/')) {
    subpath = subpath.slice(0, -1);
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  const query = event.queryStringParameters || {};
  const headers = event.headers || {};

  try {
    // 1. Model costs
    if (subpath === '/models/costs') {
      return jsonResponse(200, { success: true, costs: MODEL_CREDIT_COSTS });
    }

    // 2. User quota
    if (subpath === '/user/quota') {
      const session = await authenticate(headers);
      const userId = session ? session.userId : (query.userId || 'public_guest');
      const email = session ? session.userEmail : (query.email || '');
      const name = session ? session.userName : (query.name || '');

      const quota = await getUserQuota(userId, email, name);
      return jsonResponse(200, { success: true, quota, costs: MODEL_CREDIT_COSTS });
    }

    // 3. User signup
    if (subpath === '/user/signup') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { userId, name, email } = body;
      const record = await registerUserSignup(userId, name, email);
      return jsonResponse(200, { success: true, record });
    }

    // 4. Password reset
    if (subpath === '/user/reset-password') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { email } = body;
      const result = await sendPasswordResetEmail(email);
      return jsonResponse(200, result);
    }

    // 5. Documentation summarization (URL)
    if (subpath === '/summarize') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { url, model } = body;
      if (!url) return jsonResponse(400, { error: 'URL is required' });

      const session = await authenticate(headers);
      const effectiveUserId = session ? session.userId : (body.userId || 'public_guest');
      const effectiveUserEmail = session ? session.userEmail : (body.userEmail || '');
      const effectiveIsAdmin = session ? session.isAdmin : (headers['x-admin-mode'] === 'true' && Boolean(body.isAdmin));

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
      return jsonResponse(200, { success: true, ...result });
    }

    // 6. Summarize document / OCR text (/summarize-text and /document)
    if (subpath === '/summarize-text' || subpath === '/document') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { title, text, model } = body;
      if (!text || !text.trim()) return jsonResponse(400, { error: 'Text content is required' });

      const session = await authenticate(headers);
      const effectiveUserId = session ? session.userId : (body.userId || 'public_guest');
      const effectiveUserEmail = session ? session.userEmail : (body.userEmail || '');
      const effectiveIsAdmin = session ? session.isAdmin : (headers['x-admin-mode'] === 'true' && Boolean(body.isAdmin));

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
      return jsonResponse(200, { success: true, ...result });
    }

    // 7. Course deletion
    if (subpath === '/courses/delete') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      const { courseId, userId, userEmail } = body;
      if (!courseId) return jsonResponse(400, { error: 'courseId is required' });

      const verifiedUserId = session ? session.userId : userId;
      const verifiedEmail = session ? session.userEmail : userEmail;
      const verifiedIsAdmin = Boolean(session?.isAdmin);

      const result = await deleteCourse(courseId, verifiedUserId, verifiedEmail, verifiedIsAdmin);
      return jsonResponse(200, result);
    }

    // 8. User archive account
    if (subpath === '/user/archive') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const { reason, feedback, userId } = body;
      const session = await authenticate(headers);
      const effectiveUserId = session ? session.userId : userId;

      if (!effectiveUserId) {
        return jsonResponse(401, { error: 'Active user session or userId required.' });
      }

      const result = await archiveUserAccount(effectiveUserId, reason, feedback);
      return jsonResponse(200, result);
    }

    // 9. Feedback endpoints
    if (subpath === '/feedback') {
      if (event.httpMethod === 'POST') {
        const { userId, userEmail, userName, category, rating, comments } = body;
        const result = await submitUserFeedback({
          userId,
          userEmail,
          userName,
          category,
          rating,
          comments
        });
        return jsonResponse(200, result);
      } else if (event.httpMethod === 'GET') {
        const session = await authenticate(headers);
        if (!session || !session.isAdmin) {
          return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
        }
        const feedbacks = await listAllFeedbacks();
        return jsonResponse(200, { success: true, count: feedbacks.length, feedbacks });
      }
    }

    // 10. Admin users
    if (subpath === '/admin/users') {
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const users = await listAllUsers();
      return jsonResponse(200, { success: true, count: users.length, users });
    }

    // 11. Admin approve
    if (subpath === '/admin/approve') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { userId, email, credits } = body;
      const result = await approveUserAndSendEmail(userId, email, credits || 250);
      return jsonResponse(200, result);
    }

    // 12. Admin topup
    if (subpath === '/admin/topup') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { userId, amount, credits } = body;
      const result = await topUpUserCredits(userId, amount || credits || 250);
      return jsonResponse(200, { success: true, user: result });
    }

    // 13. Admin feedback status
    if (subpath === '/admin/feedbacks/status') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { feedbackId, status } = body;
      const result = await updateFeedbackStatus(feedbackId, status);
      return jsonResponse(200, result);
    }

    // 14. Admin test emails
    if (subpath === '/admin/test-all-emails') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { targetEmail } = body;
      const result = await testAllEmailsToAdmin(targetEmail);
      return jsonResponse(200, result);
    }

    // 15. Admin custom email
    if (subpath === '/admin/send-custom-email') {
      if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const { to, subject, message } = body;
      const result = await sendCustomTesterEmail({ to, subject, message });
      return jsonResponse(200, result);
    }

    // 16. Admin token metrics
    if (subpath === '/admin/token-metrics') {
      const session = await authenticate(headers);
      if (!session || !session.isAdmin) {
        return jsonResponse(403, { error: 'Forbidden: Admin access required.' });
      }
      const metrics = getTokenMetrics();
      return jsonResponse(200, { success: true, metrics });
    }

    return jsonResponse(404, { error: `Endpoint not found: ${subpath}` });
  } catch (err) {
    console.error(`[Netlify Function Error at ${subpath}]:`, err);
    return jsonResponse(500, { success: false, error: err.message || 'Internal Server Error' });
  }
}
