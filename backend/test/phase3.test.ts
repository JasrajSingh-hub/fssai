import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app';
import { generateToken } from '../src/utils/jwt';
import { Application } from '../src/models/application.model';
import { User } from '../src/models/user.model';
import { evaluateEligibilityRule } from '../src/rules/eligibility.rules';

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Review & Eligibility Verification Suite...\n');

  // Test 1: Unit Test Deterministic Eligibility Rule
  console.log('Test 1: Unit Testing evaluateEligibilityRule');
  const ruleResult = evaluateEligibilityRule({
    kind_of_business: 'tea_stall',
    food_categories: ['Tea & Hot Beverages', 'Fried Snacks / Samosa'],
    annual_turnover_estimated: 120000,
  });

  assert.strictEqual(ruleResult.path, 'basic_registration');
  assert.strictEqual(ruleResult.fee, 100);
  assert.strictEqual(ruleResult.currency, 'INR');
  assert.strictEqual(ruleResult.isPrototype, true);
  assert(ruleResult.disclaimer.includes('Independent Civic UX Prototype'));
  console.log('✅ Deterministic eligibility rule correctly computed prototype ₹100 basic registration');

  // Set up HTTP Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // User 1 & User 2 tokens
  const user1Id = new mongoose.Types.ObjectId().toString();
  const user2Id = new mongoose.Types.ObjectId().toString();
  const tokenUser1 = generateToken({ id: user1Id, role: 'VENDOR' });
  const tokenUser2 = generateToken({ id: user2Id, role: 'VENDOR' });

  // In-memory mock database state
  const mockAppId = new mongoose.Types.ObjectId().toString();
  let mockAppRecord: any = {
    _id: new mongoose.Types.ObjectId(mockAppId),
    userId: new mongoose.Types.ObjectId(user1Id),
    status: 'AI_PROCESSED',
    voiceIntake: {
      rawTranscript: 'Chai aur samosa',
      detectedLanguage: 'Hindi',
    },
    businessDetails: {
      stallType: 'tea_stall',
      foodCategory: ['Tea & Hot Beverages'],
      businessName: 'Chai Point',
    },
    save: async function () {
      return this;
    },
  };

  // Mock User.findById
  const originalUserFindById = User.findById;
  (User as any).findById = async (id: any) => {
    const idStr = id ? id.toString() : '';
    if (idStr === user1Id) {
      return { _id: new mongoose.Types.ObjectId(user1Id), name: 'Vendor 1', role: 'VENDOR' };
    }
    if (idStr === user2Id) {
      return { _id: new mongoose.Types.ObjectId(user2Id), name: 'Vendor 2', role: 'VENDOR' };
    }
    return null;
  };

  // Mock Application.findById
  const originalAppFindById = Application.findById;
  (Application as any).findById = async (id: any) => {
    if (id && id.toString() === mockAppId) return mockAppRecord;
    return null;
  };

  // 1. Unauthorized application update -> 401
  console.log('\nTest 2: Unauthorized application update returns 401');
  const unauthRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind_of_business: 'tea_stall',
      food_categories: ['Tea'],
    }),
  });
  assert.strictEqual(unauthRes.status, 401, 'Should be 401 without token');
  console.log('✅ Unauthorized PATCH returned 401');

  // 2. User cannot update another user's application -> 403
  console.log('\nTest 3: User cannot update another user application returns 403');
  const forbiddenRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser2}`, // User 2 trying to update User 1's app
    },
    body: JSON.stringify({
      kind_of_business: 'tea_stall',
      food_categories: ['Tea'],
    }),
  });
  assert.strictEqual(forbiddenRes.status, 403, 'Should be 403 Forbidden');
  console.log('✅ Cross-user application update correctly rejected with 403 Forbidden');

  // 3. Invalid review data -> 400
  console.log('\nTest 4: Invalid review data returns 400');
  const invalidRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      kind_of_business: 'invalid_type_123', // not in enum
      food_categories: [], // empty array
    }),
  });
  assert.strictEqual(invalidRes.status, 400, 'Invalid fields should fail Zod validation');
  console.log('✅ Invalid review data returned 400 Bad Request with Zod details');

  // 6. Eligibility cannot run before confirmation -> 400
  console.log('\nTest 5: Eligibility cannot run before business confirmation returns 400');
  mockAppRecord.status = 'AI_PROCESSED'; // Not confirmed yet
  const prematureRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/check-eligibility`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUser1}`,
    },
  });
  assert.strictEqual(prematureRes.status, 400, 'Should reject eligibility before USER_CONFIRMED');
  const prematureData = await prematureRes.json() as any;
  assert(prematureData.error.message.includes('reviewed and confirmed first'));
  console.log('✅ Premature eligibility check correctly blocked with 400');

  // 4. Valid confirmation -> USER_CONFIRMED
  console.log('\nTest 6: Valid business confirmation sets USER_CONFIRMED');
  const confirmRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      kind_of_business: 'tea_stall',
      food_categories: ['Tea & Hot Beverages', 'Fried Snacks / Samosa'],
      business_description: 'Confirmed tea stall',
    }),
  });
  assert.strictEqual(confirmRes.status, 200);
  const confirmData = await confirmRes.json() as any;
  assert.strictEqual(confirmData.success, true);
  assert.strictEqual(mockAppRecord.status, 'USER_CONFIRMED');
  assert.strictEqual(mockAppRecord.businessDetails.stallType, 'tea_stall');
  console.log('✅ Valid review update successfully transitioned application to USER_CONFIRMED');

  // 5. Eligibility endpoint requires authentication -> 401
  console.log('\nTest 7: Eligibility endpoint requires authentication returns 401');
  const unauthEligRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/check-eligibility`, {
    method: 'POST',
  });
  assert.strictEqual(unauthEligRes.status, 401);
  console.log('✅ Unauthenticated eligibility check returned 401');

  // 7 & 8. Valid confirmed application -> ELIGIBILITY_CHECKED and result is persisted
  console.log('\nTest 8: Valid confirmed application transitions to ELIGIBILITY_CHECKED');
  const eligRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/check-eligibility`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUser1}`,
    },
  });
  assert.strictEqual(eligRes.status, 200);
  const eligData = await eligRes.json() as any;
  assert.strictEqual(eligData.success, true);
  assert.strictEqual(eligData.data.eligibility.path, 'basic_registration');
  assert.strictEqual(eligData.data.eligibility.fee, 100);
  assert.strictEqual(eligData.data.eligibility.isPrototype, true);
  assert.strictEqual(mockAppRecord.status, 'ELIGIBILITY_CHECKED');
  assert(mockAppRecord.eligibility !== undefined, 'Eligibility must be persisted on application');
  console.log('✅ Eligibility successfully computed, persisted, and transitioned status to ELIGIBILITY_CHECKED');

  // Restore mocks
  (User as any).findById = originalUserFindById;
  (Application as any).findById = originalAppFindById;
  server.close();

  console.log('\n🎉 ALL 8 PHASE 3 TEST SCENARIOS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runPhase3Tests().catch((err) => {
  console.error('❌ Phase 3 test failed:', err);
  process.exit(1);
});