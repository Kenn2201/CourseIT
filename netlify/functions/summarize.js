import { handleApiRequest } from '../../server/request.js';

// Keep legacy requests on the same authentication and maintenance pipeline.
export default function handler(request, context) {
  return handleApiRequest(request, context, '/api/summarize');
}
