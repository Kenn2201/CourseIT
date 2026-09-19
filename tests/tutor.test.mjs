import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { normalizeCourseStepV2, normalizeCourse } from '../shared/courses.js';
import { STARTER_COURSES } from '../shared/starterCourses.js';
import { parseAndValidateStepsV2 } from '../server/courseSchema.js';
import { chunkDocumentText, retrieveRelevantChunks } from '../server/courseChunks.js';
import { TUTOR_CREDIT_COSTS, GUEST_TUTOR_DAILY_LIMIT, checkTutorQuota, deductTutorQuota, handleTutorQuery } from '../server/tutor.js';
import { resolveCourse } from '../server/catalog.js';
import { writeState, readState } from '../server/state.js';

// Setup offline mock for Gemini LLM in tutor tests
process.env.GEMINI_API_KEY = 'test-mock-key';
let mockGeminiStatus = 200;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  if (url.includes('generativelanguage.googleapis.com')) {
    if (mockGeminiStatus !== 200) {
      return new Response(JSON.stringify({
        error: { code: mockGeminiStatus, message: `Simulated provider failure ${mockGeminiStatus}` }
      }), { status: mockGeminiStatus, headers: { 'content-type': 'application/json' } });
    }
    return Response.json({
      candidates: [{
        content: {
          role: 'model',
          parts: [{ text: 'Signals decouple objects by emitting named events that listeners subscribe to.' }]
        },
        finishReason: 'STOP'
      }],
      usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, totalTokenCount: 70 }
    });
  }
  return originalFetch ? originalFetch(input, options) : new Response('Not found', { status: 404 });
};

test('normalizeCourseStepV2: legacy step bridges cleanly to v2 without throwing', () => {
  const legacyStep = {
    step_number: 1,
    title: 'Install Firebase CLI',
    time_estimate: '~5 min',
    summary: 'Install the Firebase CLI globally via npm to manage projects.',
    implementation: '1. Open terminal.\n2. Run npm install -g firebase-tools.\n3. Login via firebase login.',
    code_snippet: 'npm install -g firebase-tools',
    pro_tip: 'Run firebase --version to verify.'
  };

  const normalized = normalizeCourseStepV2(legacyStep, 0);

  // v2 fields populated
  assert.equal(normalized.step_number, 1);
  assert.equal(normalized.title, 'Install Firebase CLI');
  assert.equal(normalized.estimatedMinutes, 5);
  assert.equal(normalized.goal, legacyStep.summary);
  assert.equal(normalized.why, null);
  assert.equal(normalized.actions.length, 3);
  assert.equal(normalized.actions[1], 'Run npm install -g firebase-tools.');
  assert.equal(normalized.proTip, legacyStep.pro_tip);
  assert.equal(normalized.checkpoint, null);
  assert.deepEqual(normalized.commonMistakes, []);
  assert.deepEqual(normalized.suggestedQuestions, []);

  // Bridges preserved for legacy exports
  assert.equal(normalized.summary, legacyStep.summary);
  assert.equal(normalized.implementation, legacyStep.implementation);
  assert.equal(normalized.code_snippet, legacyStep.code_snippet);
});

test('normalizeCourseStepV2: full Course v2 step retains all rich fields', () => {
  const v2Step = {
    step_number: 2,
    id: 'firebase-register-app',
    title: 'Register Apps',
    time_estimate: '~10 min',
    goal: 'Register your application with Firebase.',
    why: 'Firebase needs to identify your application before generating its configuration.',
    actions: [
      'Open your Firebase project',
      'Choose iOS, Android, or Web',
      'Enter the package name or bundle ID',
      'Download or copy the generated configuration'
    ],
    expectedResult: 'Your app appears in Firebase Project Settings and you have its Firebase configuration.',
    commonMistakes: [
      'Using the wrong package name or bundle ID',
      'Registering the wrong platform'
    ],
    proTip: 'Verify your package name before registering.',
    checkpoint: {
      question: 'What should you have after completing this step?',
      options: [
        'A registered app and Firebase configuration',
        'A deployed Cloud Function',
        'A Firestore collection'
      ],
      correctIndex: 0,
      explanation: 'Registration gives your application its Firebase configuration.'
    },
    suggestedQuestions: [
      'What is a bundle ID?',
      'Where do I find my package name?'
    ],
    sourceRefs: ['chunk_0', 'chunk_1'],
    code_snippet: 'const app = initializeApp(firebaseConfig);'
  };

  const normalized = normalizeCourseStepV2(v2Step, 1);

  assert.equal(normalized.title, 'Register Apps');
  assert.equal(normalized.goal, 'Register your application with Firebase.');
  assert.equal(normalized.why, 'Firebase needs to identify your application before generating its configuration.');
  assert.equal(normalized.actions.length, 4);
  assert.equal(normalized.expectedResult, 'Your app appears in Firebase Project Settings and you have its Firebase configuration.');
  assert.equal(normalized.commonMistakes.length, 2);
  assert.equal(normalized.checkpoint.correctIndex, 0);
  assert.equal(normalized.checkpoint.explanation, 'Registration gives your application its Firebase configuration.');
  assert.deepEqual(normalized.sourceRefs, ['chunk_0', 'chunk_1']);
  assert.deepEqual(normalized.suggestedQuestions, ['What is a bundle ID?', 'Where do I find my package name?']);
});

test('parseAndValidateStepsV2: parses json string into v2 course with validation', () => {
  const jsonPayload = JSON.stringify({
    title: 'Firebase Authentication Path',
    overview: 'Learn Firebase Auth setup.',
    recommended_next_step: 'Add Firestore rules',
    steps: [
      {
        step_number: 1,
        title: 'Initialize Firebase',
        time_estimate: '~10 min',
        goal: 'Initialize Firebase SDK in your project',
        actions: ['npm install firebase', 'Create firebase.js', 'Call initializeApp'],
        checkpoint: {
          question: 'Which method initializes Firebase?',
          options: ['initializeApp', 'startApp', 'connectFirebase'],
          correct_index: 0,
          explanation: 'initializeApp creates the default Firebase app instance.'
        },
        suggested_questions: ['Can I have multiple apps?']
      }
    ]
  });

  const parsed = parseAndValidateStepsV2(jsonPayload);
  assert.equal(parsed.title, 'Firebase Authentication Path');
  assert.equal(parsed.steps.length, 1);
  assert.equal(parsed.steps[0].title, 'Initialize Firebase');
  assert.equal(parsed.steps[0].checkpoint.question, 'Which method initializes Firebase?');
  assert.equal(parsed.steps[0].checkpoint.correctIndex, 0);
});

test('chunkDocumentText: produces stable chunk IDs, preserves code blocks and headings', () => {
  const sampleDoc = `
# Getting Started with Firebase

Firebase helps you build and run successful apps.

\`\`\`javascript
import { initializeApp } from 'firebase/app';
const firebaseConfig = { apiKey: 'xyz' };
const app = initializeApp(firebaseConfig);
\`\`\`

## Configuration Details

To connect your app, download google-services.json or firebaseConfig object.
Always make sure your package name matches the bundle identifier.
`;

  const chunks = chunkDocumentText(sampleDoc, 'course-123', 'https://firebase.google.com/docs');
  assert.ok(chunks.length >= 1);
  assert.equal(chunks[0].id, 'chunk_0');
  assert.equal(chunks[0].courseId, 'course-123');
  assert.ok(chunks[0].text.includes('import { initializeApp }'));
  assert.ok(chunks[0].keywords.length > 0);
});

test('retrieveRelevantChunks: prioritizes step sourceRefs first, then heading/keyword relevance', () => {
  const chunks = [
    { id: 'chunk_0', heading: 'Project Setup', text: 'Create a new project in console.', keywords: ['project', 'setup', 'console'] },
    { id: 'chunk_1', heading: 'Register Apps', text: 'Register iOS or Android bundle ID.', keywords: ['register', 'bundle', 'ios', 'android'] },
    { id: 'chunk_2', heading: 'Initialize SDK', text: 'Call initializeApp with config.', keywords: ['initialize', 'sdk', 'config'] }
  ];

  // When step has explicit sourceRefs
  const byRef = retrieveRelevantChunks({
    chunks,
    stepSourceRefs: ['chunk_1'],
    stepTitle: 'Any step title',
    maxChunks: 2
  });
  assert.equal(byRef[0].id, 'chunk_1');
  assert.equal(byRef[0].relevanceTier, 'step_sourceRef');

  // When searching by title / keywords
  const byKeyword = retrieveRelevantChunks({
    chunks,
    stepSourceRefs: [],
    stepTitle: 'Initialize Firebase SDK',
    userQuery: 'How to config?',
    maxChunks: 1
  });
  assert.equal(byKeyword[0].id, 'chunk_2');
});

test('tutor quotas and pricing: separate from full course generation costs', () => {
  assert.equal(TUTOR_CREDIT_COSTS.quick, 0.1);
  assert.equal(TUTOR_CREDIT_COSTS.normal, 0.25);
  assert.equal(TUTOR_CREDIT_COSTS.deep, 0.5);
  assert.equal(GUEST_TUTOR_DAILY_LIMIT, 15);
});

test('resolveCourse: resolves curated starter courses without network/database lookups', async () => {
  const result = await resolveCourse('starter-react-server-components');
  assert.equal(result.isStarter, true);
  assert.equal(result.sourceType, 'curated_starter');
  assert.equal(result.course.$id, 'starter-react-server-components');
  assert.equal(result.course.title, 'React 19 Server Components & Actions');
  assert.ok(result.course.steps.length > 0);
});

test('resolveCourse: resolves persisted courses and protects private courses', async () => {
  const courseId = 'course-persist-' + randomUUID();
  await writeState('courses/' + courseId, normalizeCourse({
    $id: courseId,
    $createdAt: new Date().toISOString(),
    title: 'Private Test Course',
    creator_id: 'user_alice',
    visibility: 'private',
    steps: [{ step_number: 1, title: 'Step 1' }]
  }));

  // Owner can resolve
  const ownerResult = await resolveCourse(courseId, { userId: 'user_alice', isAdmin: false });
  assert.equal(ownerResult.isStarter, false);
  assert.equal(ownerResult.course.title, 'Private Test Course');

  // Unauthorized user cannot resolve
  await assert.rejects(
    () => resolveCourse(courseId, { userId: 'user_bob', isAdmin: false }),
    /Access Denied/
  );

  // Anonymous user cannot resolve private course
  await assert.rejects(
    () => resolveCourse(courseId, null),
    /Authentication Required/
  );
});

test('resolveCourse: throws 404 for nonexistent course', async () => {
  await assert.rejects(
    () => resolveCourse('nonexistent-course-id-999'),
    /Course not found/
  );
});

test('strict stepIndex validation: rejects negative, float, string, and out-of-range indices with HTTP 400', async () => {
  // Course with 4 steps has valid step indices 0, 1, 2, 3
  const starterId = 'starter-react-server-components';

  // Negative stepIndex -> 400
  await assert.rejects(
    () => handleTutorQuery({ courseId: starterId, stepIndex: -1, question: 'test' }),
    err => err.status === 400 && /non-negative integer/.test(err.message)
  );

  // Fractional stepIndex -> 400
  await assert.rejects(
    () => handleTutorQuery({ courseId: starterId, stepIndex: 1.5, question: 'test' }),
    err => err.status === 400 && /non-negative integer/.test(err.message)
  );

  // String stepIndex -> 400
  await assert.rejects(
    () => handleTutorQuery({ courseId: starterId, stepIndex: 'first', question: 'test' }),
    err => err.status === 400 && /non-negative integer/.test(err.message)
  );

  // Out-of-range stepIndex -> 400
  await assert.rejects(
    () => handleTutorQuery({ courseId: starterId, stepIndex: 999, question: 'test' }),
    err => err.status === 400 && /out of range/.test(err.message)
  );
});

test('credit balance verification vs post-call deduction: safe against provider failure', async () => {
  const userId = 'user_test_' + randomUUID();
  await writeState('users/' + userId, {
    status: 'approved',
    quota_remaining: 5.0,
    creditHistory: []
  });

  // checkTutorQuota succeeds for sufficient balance and DOES NOT deduct
  const check = await checkTutorQuota({ userId, isAdmin: false, mode: 'normal' });
  assert.equal(check.cost, 0.25);
  const beforeUser = await readState('users/' + userId);
  assert.equal(beforeUser.quota_remaining, 5.0);

  // deductTutorQuota deducts exactly the cost after success
  const deducted = await deductTutorQuota({ userId, isAdmin: false, mode: 'normal', courseId: 'dummy' });
  assert.equal(deducted.cost, 0.25);
  assert.equal(deducted.remaining, 4.75);
  const afterUser = await readState('users/' + userId);
  assert.equal(afterUser.quota_remaining, 4.75);

  // Repeated fractional deductions remain numerically precise
  await deductTutorQuota({ userId, isAdmin: false, mode: 'quick', courseId: 'dummy' }); // -0.1 -> 4.65
  await deductTutorQuota({ userId, isAdmin: false, mode: 'deep', courseId: 'dummy' });  // -0.5 -> 4.15
  const multiUser = await readState('users/' + userId);
  assert.equal(multiUser.quota_remaining, 4.15);

  // When balance is insufficient, checkTutorQuota rejects BEFORE calling providers
  await writeState('users/' + userId, {
    status: 'approved',
    quota_remaining: 0.05,
    creditHistory: []
  });
  await assert.rejects(
    () => checkTutorQuota({ userId, isAdmin: false, mode: 'quick' }), // requires 0.1
    err => err.status === 402 && /Insufficient credits/.test(err.message)
  );
});

test('handleTutorQuery on starter course: answers without fabricating sourceRefs or throwing 404', async () => {
  const result = await handleTutorQuery({
    courseId: 'starter-godot-signals',
    stepIndex: 0,
    question: 'How do I declare signals in GDScript?'
  });

  assert.equal(result.success, true);
  assert.ok(result.answer.length > 0);
  // Starter course has no stored documentation chunks -> sourceRefs must be empty, no fake citations
  assert.deepEqual(result.sourceRefs, []);
  assert.equal(result.suggestedActions.length, 0);
  assert.equal(result.usage.isGuest, true);
  assert.equal(result.usage.cost, 0);
});

test('handleTutorQuery: failed provider call (429/5xx) leaves user credits unchanged', async () => {
  const userId = 'user_fail_test_' + randomUUID();
  await writeState('users/' + userId, {
    status: 'approved',
    quota_remaining: 10.0,
    creditHistory: []
  });

  // Simulate 429 rate limit
  mockGeminiStatus = 429;
  try {
    await assert.rejects(
      () => handleTutorQuery({
        courseId: 'starter-godot-signals',
        stepIndex: 0,
        question: 'Help me debug this error',
        session: { userId, isAdmin: false }
      })
    );
    // User credits must still be 10.0!
    const user429 = await readState('users/' + userId);
    assert.equal(user429.quota_remaining, 10.0);
  } finally {
    mockGeminiStatus = 200;
  }

  // Simulate 503 provider unavailable
  mockGeminiStatus = 503;
  try {
    await assert.rejects(
      () => handleTutorQuery({
        courseId: 'starter-godot-signals',
        stepIndex: 0,
        question: 'Help me debug this error',
        session: { userId, isAdmin: false }
      })
    );
    // User credits must still be 10.0!
    const user503 = await readState('users/' + userId);
    assert.equal(user503.quota_remaining, 10.0);
  } finally {
    mockGeminiStatus = 200;
  }
});

test('handleTutorQuery: successful quick, normal, and deep requests deduct exactly 0.1, 0.25, and 0.5', async () => {
  const userId = 'user_tiers_' + randomUUID();
  await writeState('users/' + userId, {
    status: 'approved',
    quota_remaining: 5.0,
    creditHistory: []
  });

  // Quick mode -> exactly 0.1
  const quickRes = await handleTutorQuery({
    courseId: 'starter-godot-signals',
    stepIndex: 0,
    question: 'Quick query',
    mode: 'quick',
    session: { userId, isAdmin: false }
  });
  assert.equal(quickRes.usage.cost, 0.1);
  assert.equal((await readState('users/' + userId)).quota_remaining, 4.9);

  // Normal mode -> exactly 0.25
  const normalRes = await handleTutorQuery({
    courseId: 'starter-godot-signals',
    stepIndex: 0,
    question: 'Normal query',
    mode: 'normal',
    session: { userId, isAdmin: false }
  });
  assert.equal(normalRes.usage.cost, 0.25);
  assert.equal((await readState('users/' + userId)).quota_remaining, 4.65);

  // Deep mode -> exactly 0.5
  const deepRes = await handleTutorQuery({
    courseId: 'starter-godot-signals',
    stepIndex: 0,
    question: 'Deep query',
    mode: 'deep',
    session: { userId, isAdmin: false }
  });
  assert.equal(deepRes.usage.cost, 0.5);
  assert.equal((await readState('users/' + userId)).quota_remaining, 4.15);
});
