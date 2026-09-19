/**
 * CourseIT Course v2 Schema & Normalization Module
 *
 * Provides single source of truth for Course v2 structured learning steps,
 * defensive parsing, and backward-compatible bridges for legacy v1 course data.
 */

export function slugifyTitle(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

/**
 * Extracts numeric minutes from time string (e.g. "~10 min" -> 10).
 */
export function extractMinutes(timeEstimate, defaultMin = 10) {
  if (typeof timeEstimate === 'number' && Number.isFinite(timeEstimate)) return timeEstimate;
  const match = String(timeEstimate || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : defaultMin;
}

/**
 * Parses raw implementation text (e.g. "1. Do A\n2. Do B") into distinct action strings.
 */
export function parseActionsFromText(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text.map(t => String(t).trim()).filter(Boolean);

  const splitRegex = /(?:^|\s)(?=\d+[\.\)]\s+)/;
  const parts = String(text).split(splitRegex).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map(part => part.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
  }

  const lines = String(text).split(/\r?\n/).map(l => l.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (lines.length > 1) {
    return lines;
  }

  const single = String(text).trim();
  return single ? [single] : [];
}

/**
 * Validates and bridges a single step object into the full Course v2 shape.
 * Never mutates or throws on legacy missing fields.
 */
export function normalizeCourseStepV2(step, idx = 0) {
  if (!step || typeof step !== 'object') {
    step = { title: typeof step === 'string' ? step : `Step ${idx + 1}` };
  }

  const stepNumber = Number(step.step_number || idx + 1);
  const title = String(step.title || `Step ${stepNumber}`).trim();
  const timeEstimate = String(step.time_estimate || step.timeEstimate || '~10 min').trim();
  const estimatedMinutes = extractMinutes(step.estimatedMinutes || timeEstimate, 10);
  const id = String(step.id || `step-${stepNumber}-${slugifyTitle(title)}`);

  // Goal & Why
  const goal = String(step.goal || step.summary || title).trim();
  const why = step.why ? String(step.why).trim() : null;

  // Actions
  let actions = [];
  if (Array.isArray(step.actions) && step.actions.length > 0) {
    actions = step.actions.map(a => String(a).trim()).filter(Boolean);
  } else if (step.implementation) {
    actions = parseActionsFromText(step.implementation);
  } else if (step.summary) {
    actions = [String(step.summary).trim()];
  }
  if (actions.length === 0) {
    actions = [`Complete ${title}`];
  }

  // Expected Result & Mistakes
  const expectedResult = step.expectedResult || step.expected_result
    ? String(step.expectedResult || step.expected_result).trim()
    : null;

  const rawMistakes = step.commonMistakes || step.common_mistakes;
  const commonMistakes = Array.isArray(rawMistakes)
    ? rawMistakes.map(m => String(m).trim()).filter(Boolean)
    : [];

  // Pro tip
  const proTip = String(step.proTip || step.pro_tip || '').trim() || null;

  // Checkpoint validation
  let checkpoint = null;
  const rawCheckpoint = step.checkpoint;
  if (rawCheckpoint && typeof rawCheckpoint === 'object' && rawCheckpoint.question) {
    const question = String(rawCheckpoint.question).trim();
    const options = Array.isArray(rawCheckpoint.options)
      ? rawCheckpoint.options.map(o => String(o).trim()).filter(Boolean)
      : [];
    let correctIndex = Number.isInteger(rawCheckpoint.correctIndex)
      ? rawCheckpoint.correctIndex
      : Number.isInteger(rawCheckpoint.correct_index)
      ? rawCheckpoint.correct_index
      : 0;
    if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
    const explanation = String(rawCheckpoint.explanation || '').trim();

    if (question && options.length >= 2) {
      checkpoint = {
        question,
        options,
        correctIndex,
        explanation
      };
    }
  }

  // Suggested questions (generated upfront, zero runtime AI cost)
  const rawQuestions = step.suggestedQuestions || step.suggested_questions;
  const suggestedQuestions = Array.isArray(rawQuestions)
    ? rawQuestions.map(q => String(q).trim()).filter(Boolean)
    : [];

  // Source refs (stable chunk IDs)
  const rawRefs = step.sourceRefs || step.source_refs;
  const sourceRefs = Array.isArray(rawRefs)
    ? rawRefs.map(r => String(r).trim()).filter(Boolean)
    : [];

  // Code snippet & examples
  const codeSnippet = typeof step.code_snippet === 'string' && step.code_snippet.trim()
    ? step.code_snippet.trim()
    : null;

  let codeExamples = Array.isArray(step.codeExamples) ? step.codeExamples : [];
  if (codeExamples.length === 0 && codeSnippet) {
    codeExamples = [{ language: 'code', code: codeSnippet }];
  }

  // Backward compatibility bridge fields for legacy consumers / exports
  const summaryBridge = step.summary || goal;
  const implementationBridge = step.implementation || actions.map((a, i) => `${i + 1}. ${a}`).join('\n');

  return {
    step_number: stepNumber,
    id,
    title,
    time_estimate: timeEstimate,
    estimatedMinutes,
    goal,
    why,
    actions,
    expectedResult,
    commonMistakes,
    proTip,
    pro_tip: proTip || '',
    checkpoint,
    suggestedQuestions,
    sourceRefs,
    code_snippet: codeSnippet,
    codeExamples,
    summary: summaryBridge,
    implementation: implementationBridge
  };
}

/**
 * Parses raw JSON string returned by LLM into Course v2 data structure.
 */
export function parseAndValidateStepsV2(rawJsonString, fallbackTitle = 'Technical Course') {
  let cleaned = String(rawJsonString || '').trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw Object.assign(new Error(`Failed to parse structured JSON from LLM: ${err.message}`), {
      status: 502,
      provider: true
    });
  }

  const title = parsed.title || fallbackTitle;
  const overview = parsed.overview || '';
  const recommendedNextStep = parsed.recommended_next_step || parsed.recommendedNextStep || '';
  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : (Array.isArray(parsed) ? parsed : []);

  if (!rawSteps.length) {
    throw Object.assign(new Error('LLM did not return any learning steps.'), {
      status: 502,
      provider: true
    });
  }

  const steps = rawSteps.map((step, idx) => normalizeCourseStepV2(step, idx));

  return {
    title,
    overview,
    recommended_next_step: recommendedNextStep,
    steps
  };
}
