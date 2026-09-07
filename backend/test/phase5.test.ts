import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app';
import { generateToken } from '../src/utils/jwt';
import { Application } from '../src/models/application.model';
import { Payment } from '../src/models/payment.model';
import { VendorPass } from '../src/models/vendorPass.model';
import { User } from '../src/models/user.model';

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Mock Payment & Synthetic Vendor Pass Suite...\n');

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
    status: 'HYGIENE_GENERATED',
    voiceIntake: { rawTranscript: 'Chai thela' },
    businessDetails: { stallType: 'tea_stall', foodCategory: ['Tea', 'Samosa'] },
    eligibility: { path: 'basic_registration', fee: 100, currency: 'INR', isPrototype: true },
    save: async function () {
      return this;
    },
  };

  let mockPayments: any[] = [];
  let mockPasses: any[] = [];

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

  // Mock Payment methods
  const originalPaymentCreate = Payment.create;
  const originalPaymentFindOne = Payment.findOne;
  (Payment as any).create = async (doc: any) => {
    const newDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
    };
    mockPayments.push(newDoc);
    return newDoc;
  };
  (Payment as any).findOne = async (filter: any) => {
    return mockPayments.find((p) => p.applicationId.toString() === filter.applicationId.toString()) || null;
  };

  // Mock VendorPass methods
  const originalPassCreate = VendorPass.create;
  const originalPassFindOne = VendorPass.findOne;
  (VendorPass as any).create = async (doc: any) => {
    const newDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
    };
    mockPasses.push(newDoc);
    return newDoc;
  };
  (VendorPass as any).findOne = async (filter: any) => {
    if (filter.applicationId) {
      return mockPasses.find((p) => p.applicationId.toString() === filter.applicationId.toString()) || null;
    }
    if (filter.passNumber) {
      return mockPasses.find((p) => p.passNumber === filter.passNumber) || null;
    }
    return null;
  };

  // 1. Unauthenticated payment -> 401
  console.log('Test 1: Unauthenticated payment returns 401');
  const unauthPayRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/payment/simulate`, {
    method: 'POST',
  });
  assert.strictEqual(unauthPayRes.status, 401);
  console.log('✅ Unauthenticated payment returned 401');

  // 2. User cannot pay another user's application -> 403
  console.log('\nTest 2: User cannot pay another user application returns 403');
  const forbiddenPayRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/payment/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser2}` },
  });
  assert.strictEqual(forbiddenPayRes.status, 403);
  console.log('✅ Cross-user payment attempt correctly rejected with 403 Forbidden');

  // 3. Payment before hygiene -> 400
  console.log('\nTest 3: Payment before hygiene completion returns 400');
  mockAppRecord.status = 'ELIGIBILITY_CHECKED'; // Prior to hygiene
  const prematurePayRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/payment/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(prematurePayRes.status, 400);
  const prematurePayData = await prematurePayRes.json() as any;
  assert(prematurePayData.error.message.includes('must be completed first'));
  console.log('✅ Premature payment rejected with 400');

  // 4. Frontend cannot control payment amount & 5. Valid prototype payment -> 200
  console.log('\nTest 4 & 5: Valid prototype payment simulation (backend-controlled amount = 100)');
  mockAppRecord.status = 'HYGIENE_GENERATED'; // Valid state
  const validPayRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/payment/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenUser1}`,
    },
    // Frontend sends arbitrary amount 99999, which backend must IGNORE
    body: JSON.stringify({ amount: 99999 }),
  });
  assert.strictEqual(validPayRes.status, 200);
  const validPayData = await validPayRes.json() as any;
  assert.strictEqual(validPayData.success, true);
  assert.strictEqual(validPayData.data.amount, 100, 'Amount must be ₹100 controlled by backend');
  assert.strictEqual(validPayData.data.status, 'SIMULATED_SUCCESS');
  assert.strictEqual(validPayData.data.isPrototype, true);
  assert.strictEqual(mockAppRecord.status, 'PAYMENT_SIMULATED');
  console.log('✅ Valid prototype payment succeeded with ₹100 and updated status to PAYMENT_SIMULATED');

  // 6. Duplicate payment -> rejected safely (400)
  console.log('\nTest 6: Duplicate payment rejected safely with 400');
  const duplicatePayRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/payment/simulate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(duplicatePayRes.status, 400);
  const dupData = await duplicatePayRes.json() as any;
  assert(dupData.error.message.includes('already been simulated'));
  console.log('✅ Duplicate payment safely blocked with 400');

  // 7. Vendor pass cannot generate before payment -> 400
  console.log('\nTest 7: Vendor pass cannot generate before payment simulation');
  const unverifiedAppId = new mongoose.Types.ObjectId().toString();
  const unverifiedApp = {
    _id: new mongoose.Types.ObjectId(unverifiedAppId),
    userId: new mongoose.Types.ObjectId(user1Id),
    status: 'HYGIENE_GENERATED', // Not paid yet
  };
  (Application as any).findById = async (id: any) => {
    if (id && id.toString() === unverifiedAppId) return unverifiedApp;
    if (id && id.toString() === mockAppId) return mockAppRecord;
    return null;
  };
  const prematurePassRes = await fetch(`${baseUrl}/api/v1/applications/${unverifiedAppId}/pass`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(prematurePassRes.status, 400);
  console.log('✅ Premature pass generation correctly rejected with 400');

  // 8. Vendor pass generation after payment -> success
  console.log('\nTest 8: Vendor pass generation after payment succeeds');
  const validPassRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/pass`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(validPassRes.status, 200);
  const validPassData = await validPassRes.json() as any;
  assert.strictEqual(validPassData.success, true);
  const pass = validPassData.data;
  assert(pass.passId.startsWith('VPR-2026-'), 'Pass ID must have synthetic prefix');
  assert(pass.syntheticReferenceId.startsWith('SYN-FSSAI-'), 'Reference ID must have synthetic prefix');
  assert.strictEqual(pass.prototypeStatus, 'PROTOTYPE');
  assert(['PASS_GENERATED', 'COMPLETED'].includes(mockAppRecord.status));
  console.log(`✅ Vendor pass generated with synthetic identifiers and status = ${mockAppRecord.status}`);

  // 9. Duplicate pass generation -> handled safely (returns existing pass)
  console.log('\nTest 9: Duplicate pass generation handled safely');
  const duplicatePassRes = await fetch(`${baseUrl}/api/v1/applications/${mockAppId}/pass`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenUser1}` },
  });
  assert.strictEqual(duplicatePassRes.status, 200);
  const dupPassData = await duplicatePassRes.json() as any;
  assert.strictEqual(dupPassData.data.passId, pass.passId, 'Must return identical existing pass ID');
  console.log('✅ Duplicate pass call safely returned existing pass');

  // 10. QR payload contains no sensitive PII & 11. QR payload contains passId/applicationId/status only
  console.log('\nTest 10 & 11: Verifying QR payload contains zero sensitive PII');
  const qr = pass.qrPayload;
  assert.strictEqual(qr.type, 'DEMO_VENDOR_PASS');
  assert.strictEqual(qr.passId, pass.passId);
  assert.strictEqual(qr.applicationId, mockAppId);
  assert.strictEqual(qr.status, 'PROTOTYPE');
  // Strict PII absence checks
  assert.strictEqual((qr as any).aadhaar, undefined);
  assert.strictEqual((qr as any).pan, undefined);
  assert.strictEqual((qr as any).phone, undefined);
  assert.strictEqual((qr as any).bankAccount, undefined);
  assert.strictEqual((qr as any).address, undefined);
  console.log('✅ QR payload strictly limited to synthetic non-PII identifiers');

  // 12. Prototype verification works
  console.log('\nTest 12: Prototype verification endpoint GET /api/v1/vendor-pass/:passId');
  const verifyRes = await fetch(`${baseUrl}/api/v1/vendor-pass/${pass.passId}`);
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json() as any;
  assert.strictEqual(verifyData.success, true);
  assert.strictEqual(verifyData.data.passId, pass.passId);
  assert.strictEqual(verifyData.data.isPrototype, true);
  assert(verifyData.data.disclaimer.includes('NOT AN OFFICIAL FSSAI REGISTRATION'));
  console.log('✅ Prototype verification endpoint returned 200 with synthetic pass information');

  // 13. Unknown passId -> 404
  console.log('\nTest 13: Unknown passId returns 404');
  const unknownRes = await fetch(`${baseUrl}/api/v1/vendor-pass/UNKNOWN_FAKE_PASS_999`);
  assert.strictEqual(unknownRes.status, 404);
  console.log('✅ Unknown passId returned 404 Not Found');

  // Restore mocks
  (User as any).findById = originalUserFindById;
  (Application as any).findById = originalAppFindById;
  (Payment as any).create = originalPaymentCreate;
  (Payment as any).findOne = originalPaymentFindOne;
  (VendorPass as any).create = originalPassCreate;
  (VendorPass as any).findOne = originalPassFindOne;

  server.close();
  console.log('\n🎉 ALL 13 PHASE 5 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runPhase5Tests().catch((err) => {
  console.error('❌ Phase 5 test failed:', err);
  process.exit(1);
});