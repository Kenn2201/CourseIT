export const GUEST_COURSE_TTL_MS = 30 * 60 * 1000;

export function normalizeCourse(doc) {
  let metadata = {};
  let steps = doc.steps;
  if (typeof steps === 'string') {
    try { steps = JSON.parse(steps); } catch { steps = []; }
  }
  if (steps && !Array.isArray(steps) && typeof steps === 'object') {
    metadata = steps;
    steps = metadata.items || metadata.steps || [];
  }
  const course = { ...doc, ...metadata, steps: Array.isArray(steps) ? steps : [] };
  course.creator_id ||= null;
  course.is_guest = Boolean(course.is_guest || course.creator_id === 'public_guest');
  // Old account courses remain private until their owner explicitly publishes them.
  course.visibility ||= course.is_guest || course.is_curated ? 'public' : 'private';
  if (course.is_guest) {
    const created = Date.parse(course.$createdAt || course.createdAt);
    course.expires_at = Number.isFinite(created)
      ? new Date(created + GUEST_COURSE_TTL_MS).toISOString() : new Date(0).toISOString();
  }
  return course;
}

export function isExpiredCourse(course, now = Date.now()) {
  return course.is_guest && (!course.expires_at || Date.parse(course.expires_at) <= now);
}

export function canReadCourse(course, userId = null, isAdmin = false) {
  if (isExpiredCourse(course)) return false;
  return course.is_curated || course.visibility === 'public' ||
    (course.visibility === 'community' && Boolean(userId)) || isAdmin ||
    Boolean(userId && course.creator_id === userId && userId !== 'public_guest');
}

export function isSystemCourse(doc) {
  return doc.$id?.startsWith('system_') || doc.source_url?.startsWith('system://') ||
    doc.creator_id === 'system';
}

export function publicCourse(course, userId, isAdmin) {
  if (isAdmin || (userId && userId === course.creator_id)) return course;
  const { creator_email, creator_id, generation_request_id,
    source_file_id, source_filename, source_mime_type, source_file_bytes, source_saved_at, ...safe } = course;
  for (const field of ['source_url', 'input_url']) {
    if (typeof safe[field] === 'string' && /^https?:\/\//i.test(safe[field])) {
      try {
        const url = new URL(safe[field]);
        url.search = '';
        url.hash = '';
        safe[field] = url.href;
      } catch { delete safe[field]; }
    }
  }
  return { ...safe, creator_name: course.creator_name || (course.is_guest ? 'Guest' : 'Community member') };
}
