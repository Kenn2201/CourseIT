const PROGRESS_PREFIX = 'courseit_progress_';

/**
 * Retrieves the set of completed step numbers for a given course.
 * 
 * @param {string} courseId 
 * @returns {number[]} Array of completed step numbers
 */
export function getCompletedSteps(courseId) {
  if (!courseId) return [];
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + courseId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggles a step's completion status.
 * 
 * @param {string} courseId 
 * @param {number} stepNumber 
 * @returns {number[]} Updated array of completed step numbers
 */
export function toggleStep(courseId, stepNumber) {
  if (!courseId || stepNumber === undefined) return [];
  const current = getCompletedSteps(courseId);
  const set = new Set(current);

  if (set.has(stepNumber)) {
    set.delete(stepNumber);
  } else {
    set.add(stepNumber);
  }

  const updated = Array.from(set);
  try {
    localStorage.setItem(PROGRESS_PREFIX + courseId, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save progress to localStorage:', err);
  }
  return updated;
}

/**
 * Clears progress for a specific course.
 */
export function resetCourseProgress(courseId) {
  if (!courseId) return;
  try {
    localStorage.removeItem(PROGRESS_PREFIX + courseId);
  } catch (err) {
    console.error('Failed to reset progress:', err);
  }
}
