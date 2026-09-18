import { cleanupGuestCourses } from '../../server/catalog.js';

export const config = { schedule: '*/5 * * * *' };
export default async function handler() {
  const removed = await cleanupGuestCourses();
  return Response.json({ removed });
}
