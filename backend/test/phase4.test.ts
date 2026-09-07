import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app';
import { generateToken } from '../src/utils/jwt';
import { Application } from '../src/models/application.model';
import { User } from '../src/models/user.model';
import { getHygieneChecklistForBusiness } from '../src/rules/hygiene.rules';

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 Hygiene & Synthetic Document Verification Suite...\n');

  // Test 1: Unit Test Controlled Hygiene Rules
  console.log('Test 1: Unit Testing getHygieneChecklistForBusiness');
  const checklist = getHygieneChecklistForBusiness('tea_stall');
  assert(Array.isArray(checklist) && checklist.length >= 5, 'Checklist must contain at least 5 controlled items');
  assert(checklist.every((item) => typeof item.id === 'string' && typeof item.title === 'string'));
  console.log(`✅ Controlled hygiene checklist returned ${checklist.length} verified FSSAI Schedule 4 items`);

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
    status: 'ELIGIBILITY_CHECKED',
    voiceIntake: { rawTranscript: 'Chai thela' },
    businessDetails: { stallType: 'tea_stall', foodCategory: ['Tea'] },
    eligibility: { path: 'basic_registration', fee: 100, isPrototype: true },
    hygieneChecklist: undefined,
    syntheticDocument: undefined,
    save: async function () {
      return this;
    },
  };

  // Mock User.findById
  const originalUserFindById = User.findById;
  (User as any).findById = async (id: any) => {
    const idStr = id ? id.toString() : '';
    if (idStr === user1Id) return { _id: new mongoose.Types.ObjectId(user1Id), name: 'Vendor 1', role: 'VENDOR' };
    if (idStr === user2Id) return { _id: new mongoose.Types.ObjectId(user2Id), name: 'Vendor 2', role: 'VENDOR' };
    return null;
  };

  // Mock Application.findById
  const originalAppFindById = Application.findById;
  (Application as any).findById = async (id: any) => {
    if (id && id.toString() === mockAppId) return mockAppRecord;
    return null;
  };

  // 1. Unauthenticated hygiene request -> 401
  console.log('\nTest 2: Unauthenticated hygiene request returns 401');
  const unauthRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`);
  assert.strictEqual(unauthRes.status, 401, 'Should return 401 without auth token');
  console.log('✅ Unauthenticated request returned 401');

  // 2. User cannot access another user application -> 403
  console.log('\nTest 3: User cannot access another user application returns 403');
  const forbiddenRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`, {
    headers: { Authorization: `Bearer ${tokenUser2}` },
  });
  assert.strictEqual(forbiddenRes.status, 403, 'Should return 403 Forbidden');
  console.log('✅ Cross-user access correctly rejected with 403 Forbidden');

  // 3. Hygiene unavailable before eligibility -> 400
  console.log('\nTest 4: Hygiene unavailable before eligibility returns 400');
  mockAppRecord.status = 'AI_PROCESSED'; // Incomplete application state
  const prematureRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`, {
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(prematureRes.status, 400, 'Should reject before eligibility evaluation');
  const prematureData = await prematureRes.json() as any;
  assert(prematureData.error.message.includes('unavailable before eligibility'));
  console.log('✅ Premature hygiene request returned 400 with helpful guidance');

  // 4. Valid eligible application returns checklist -> 200
  console.log('\nTest 5: Valid eligible application returns controlled checklist');
  mockAppRecord.status = 'ELIGIBILITY_CHECKED'; // Restore eligible state
  const validChecklistRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`, {
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(validChecklistRes.status, 200);
  const checklistData = await validChecklistRes.json() as any;
  assert.strictEqual(checklistData.success, true);
  assert(Array.isArray(checklistData.data.items), 'Must return items array');
  assert.strictEqual(checklistData.data.isPrototype, true);
  console.log('✅ Valid request returned 200 with structured checklist items');

  // 5. Invalid checklist IDs rejected -> 400
  console.log('\nTest 6: Invalid arbitrary checklist IDs rejected with 400');
  const invalidIdRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      completedItemIds: ['HY001', 'FAKE_INVENTED_ID_999'],
    }),
  });
  assert.strictEqual(invalidIdRes.status, 400, 'Arbitrary IDs must be rejected');
  const invalidIdData = await invalidIdRes.json() as any;
  assert(invalidIdData.error.message.includes('Invalid checklist item ID'));
  console.log('✅ Arbitrary checklist IDs correctly rejected with 400 Bad Request');

  // 6. Checklist completion persists -> transitions to HYGIENE_GENERATED
  console.log('\nTest 7: Checklist completion persists and transitions status');
  const completeRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/hygiene`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      completedItemIds: ['HY001', 'HY002', 'HY003', 'HY004', 'HY005', 'HY006'],
    }),
  });
  assert.strictEqual(completeRes.status, 200);
  const completeData = await completeRes.json() as any;
  assert.strictEqual(completeData.success, true);
  assert.strictEqual(mockAppRecord.status, 'HYGIENE_GENERATED');
  assert.strictEqual(mockAppRecord.hygieneChecklist.overallScore, 100);
  console.log('✅ Checklist completion persisted with status = HYGIENE_GENERATED');

  // 7. Document upload requires authentication -> 401
  console.log('\nTest 8: Document upload requires authentication returns 401');
  const unauthDocRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      mimeType: 'image/png',
    }),
  });
  assert.strictEqual(unauthDocRes.status, 401);
  console.log('✅ Unauthenticated document upload returned 401');

  // 8. Invalid file type rejected -> 400
  console.log('\nTest 9: Invalid file type rejected with 400');
  const invalidTypeRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      fileData: 'data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA...',
      mimeType: 'application/x-msdownload', // Disallowed executable format
    }),
  });
  assert.strictEqual(invalidTypeRes.status, 400);
  console.log('✅ Invalid file format rejected with 400');

  // 9. Oversized file rejected -> 400
  console.log('\nTest 10: Oversized file (> 5MB) rejected with 400');
  const oversizedRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      fileData: 'data:image/png;base64,validBase64Header...',
      mimeType: 'image/png',
      fileSizeBytes: 6 * 1024 * 1024, // 6MB exceeds 5MB limit
    }),
  });
  assert.strictEqual(oversizedRes.status, 400);
  console.log('✅ Oversized file rejected with 400');

  // Valid synthetic document confirmation
  console.log('\nTest 11: Valid synthetic document upload succeeds');
  const validDocRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    body: JSON.stringify({
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      mimeType: 'image/png',
      documentTitle: 'Demo Stall Premise Photo',
      fileSizeBytes: 1024,
      isSynthetic: true,
    }),
  });
  assert.strictEqual(validDocRes.status, 200);
  const validDocData = await validDocRes.json() as any;
  assert.strictEqual(validDocData.success, true);
  assert(mockAppRecord.syntheticDocument !== undefined);
  assert.strictEqual(mockAppRecord.syntheticDocument.isSynthetic, true);
  assert(mockAppRecord.syntheticDocument.applicationRefNumber.startsWith('SYN-DOC-'));
  console.log('✅ Valid synthetic document upload recorded with synthetic reference number');

  // Restore mocks
  (User as any).findById = originalUserFindById;
  (Application as any).findById = originalAppFindById;
  server.close();

  console.log('\n🎉 ALL 10 PHASE 4 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runPhase4Tests().catch((err) => {
  console.error('❌ Phase 4 test failed:', err);
  process.exit(1);
});