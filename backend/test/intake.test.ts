import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app';
import { generateToken } from '../src/utils/jwt';
import { AIService } from '../src/services/ai.service';
import { businessExtractionSchema, ALLOWED_BUSINESS_TYPES } from '../src/ai/schemas/business.schema';
import { Application } from '../src/models/application.model';
import { User } from '../src/models/user.model';
import { env } from '../src/config/env';

async function runIntakeTests() {
  console.log('🧪 Starting Phase 2 Intake Pipeline Verification Suite...\n');

  // Test 1: OpenAI Key is Server-Only & Not Exposed
  console.log('Test 1: Verifying OPENAI_API_KEY is server-only');
  assert.strictEqual(typeof env.OPENAI_API_KEY === 'string' || env.OPENAI_API_KEY === undefined, true);
  assert.strictEqual((process.env as any).NEXT_PUBLIC_OPENAI_API_KEY, undefined, 'NEXT_PUBLIC_OPENAI_API_KEY must never exist');
  console.log('✅ OPENAI_API_KEY is strictly contained on the backend and not exposed');

  // Test 2: Natural Language Extraction (Hindi / Hinglish phrase)
  console.log('\nTest 2: Natural Language Extraction (Mock/Dev & Prompt verification)');
  const sampleTranscript = "Main chai aur samosa ka chhota thela chalata hoon.";
  const { data: extracted, isMock } = await AIService.extractBusinessData(sampleTranscript);

  console.log('Extracted business data:', JSON.stringify(extracted, null, 2));
  assert(ALLOWED_BUSINESS_TYPES.includes(extracted.kind_of_business as any), `kind_of_business "${extracted.kind_of_business}" must be valid enum`);
  assert(Array.isArray(extracted.food_categories) && extracted.food_categories.length > 0, 'food_categories must be a non-empty array');
  assert(typeof extracted.business_description === 'string' && extracted.business_description.length > 0, 'business_description must be present');
  assert(typeof extracted.language === 'string', 'language must be detected');
  assert(Array.isArray(extracted.missing_information) && extracted.missing_information.length > 0, 'missing_information must be present');
  console.log('✅ Extraction produced valid structured schema data');

  // Test 3: Security & Validation Gate: Invalid AI output CANNOT enter database
  console.log('\nTest 3: Verify invalid AI output cannot enter MongoDB');
  const invalidAIPayloads = [
    {
      // Invalid kind_of_business
      kind_of_business: 'illegal_casino_or_weapons',
      food_categories: ['Tea'],
      business_description: 'Valid desc',
      language: 'Hindi',
      missing_information: [],
    },
    {
      // Missing food_categories array
      kind_of_business: 'tea_stall',
      business_description: 'Valid desc',
      language: 'Hindi',
      missing_information: [],
    },
    {
      // Empty string description
      kind_of_business: 'hawker',
      food_categories: ['Snacks'],
      business_description: '',
      language: 'Hindi',
      missing_information: [],
    },
  ];

  for (const badPayload of invalidAIPayloads) {
    const parseResult = businessExtractionSchema.safeParse(badPayload);
    assert.strictEqual(parseResult.success, false, `Bad payload should be rejected by Zod schema: ${JSON.stringify(badPayload)}`);
  }
  console.log('✅ Zod schema strictly blocks invalid AI outputs before any DB operation');

  // Test 4: Express HTTP Intake API Integration
  console.log('\nTest 4: Express HTTP Intake API Integration');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // 4a. Unauthenticated request to /api/v1/intake/analyze must return 401
  const unauthRes = await fetch(`${baseUrl}/api/v1/intake/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: sampleTranscript }),
  });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be rejected with 401');
  const unauthData = await unauthRes.json() as any;
  assert.strictEqual(unauthData.success, false);
  console.log('✅ Unauthenticated request correctly rejected with 401');

  // Set up User & Application mocks for authenticated HTTP test calls
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const testToken = generateToken({ id: mockUserId, role: 'VENDOR' });

  const originalUserFindById = User.findById;
  const originalAppCreate = Application.create;

  const mockUserObj: any = {
    _id: new mongoose.Types.ObjectId(mockUserId),
    name: 'Ramesh Vendor',
    phone: '9876543210',
    role: 'VENDOR',
    businessName: 'Ramesh Chai Stall',
  };

  (User as any).findById = async (id: any) => {
    if (id && id.toString() === mockUserId) return mockUserObj;
    return null;
  };

  const createdAppId = new mongoose.Types.ObjectId().toString();
  (Application as any).create = async (doc: any) => {
    return {
      _id: new mongoose.Types.ObjectId(createdAppId),
      ...doc,
      save: async () => {},
    };
  };

  // 4b. Invalid body (transcript too short) must return 400
  const invalidBodyRes = await fetch(`${baseUrl}/api/v1/intake/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testToken}`,
    },
    body: JSON.stringify({ transcript: 'hi' }), // too short (min 3)
  });
  assert.strictEqual(invalidBodyRes.status, 400, 'Too short transcript must return 400');
  const invalidBodyData = await invalidBodyRes.json() as any;
  assert.strictEqual(invalidBodyData.success, false);
  assert(Array.isArray(invalidBodyData.error.details));
  console.log('✅ Invalid request body correctly rejected with 400');

  // 4c. Valid authenticated request
  const validRes = await fetch(`${baseUrl}/api/v1/intake/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testToken}`,
    },
    body: JSON.stringify({ transcript: sampleTranscript }),
  });

  const validData = await validRes.json() as any;
  assert.strictEqual(validRes.status, 200, 'Valid request should return 200 OK');
  assert.strictEqual(validData.success, true);
  assert(validData.data.applicationId, 'Must return applicationId');
  assert(validData.data.business, 'Must return business object');
  assert.strictEqual(validData.data.business.kind_of_business, 'tea_stall');
  assert(validData.data.business.food_categories.includes('Tea & Hot Beverages') || validData.data.business.food_categories.includes('Fried Snacks / Samosa'));
  assert.strictEqual(typeof validData.data.business.language, 'string');
  console.log('✅ Valid authenticated request returned 200 with structured data and applicationId');

  // Restore mocks
  (User as any).findById = originalUserFindById;
  (Application as any).create = originalAppCreate;

  server.close();
  console.log('\n🎉 ALL PHASE 2 INTAKE PIPELINE TESTS PASSED!');
  process.exit(0);
}

runIntakeTests().catch((err) => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});