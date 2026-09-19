import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCourseStepV2, normalizeCourse } from '../shared/courses.js';
import { parseAndValidateStepsV2 } from '../server/courseSchema.js';
import { chunkDocumentText, retrieveRelevantChunks } from '../server/courseChunks.js';
import { TUTOR_CREDIT_COSTS, GUEST_TUTOR_DAILY_LIMIT } from '../server/tutor.js';

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
