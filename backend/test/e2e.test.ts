import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app';
import { generateToken } from '../src/utils/jwt';
import { Application } from '../src/models/application.model';
import { Payment } from '../src/models/payment.model';
import { VendorPass } from '../src/models/vendorPass.model';
import { User } from '../src/models/user.model';

async function runE2ETest() {
  console.log('🚀 Starting Phase 6 End-to-End Master Integration Test...\n');

  // Start HTTP Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // In-memory mock database collections
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: new mongoose.Types.ObjectId(mockUserId),
    name: 'Demo Chai Vendor',
    email: 'chai_demo@streetsanitation.local',
    role: 'VENDOR',
  };

  const applicationsMap = new Map<string, any>();
  const paymentsList: any[] = [];
  const passesMap = new Map<string, any>();

  // Mock User methods
  const originalUserFindById = User.findById;
  (User as any).findById = async (id: any) => {
    if (id && id.toString() === mockUserId) return mockUser;
    return null;
  };

  // Mock Application methods
  const originalAppCreate = Application.create;
  const originalAppFindById = Application.findById;
  (Application as any).create = async (doc: any) => {
    const appId = new mongoose.Types.ObjectId().toString();
    const appDoc: any = {
      _id: new mongoose.Types.ObjectId(appId),
      ...doc,
      save: async function () {
        applicationsMap.set(appId, this);
        return this;
      },
    };
    applicationsMap.set(appId, appDoc);
    return appDoc;
  };
  (Application as any).findById = async (id: any) => {
    return applicationsMap.get(id?.toString()) || null;
  };

  // Mock Payment methods
  const originalPaymentCreate = Payment.create;
  const originalPaymentFindOne = Payment.findOne;
  (Payment as any).create = async (doc: any) => {
    const payDoc = { _id: new mongoose.Types.ObjectId(), ...doc };
    paymentsList.push(payDoc);
    return payDoc;
  };
  (Payment as any).findOne = async (filter: any) => {
    return paymentsList.find((p) => p.applicationId.toString() === filter.applicationId.toString()) || null;
  };

  // Mock VendorPass methods
  const originalPassCreate = VendorPass.create;
  const originalPassFindOne = VendorPass.findOne;
  (VendorPass as any).create = async (doc: any) => {
    const passDoc = { _id: new mongoose.Types.ObjectId(), ...doc };
    passesMap.set(doc.passNumber, passDoc);
    passesMap.set(doc.applicationId.toString(), passDoc);
    return passDoc;
  };
  (VendorPass as any).findOne = async (filter: any) => {
    if (filter.applicationId) return passesMap.get(filter.applicationId.toString()) || null;
    if (filter.passNumber) return passesMap.get(filter.passNumber) || null;
    return null;
  };

  // 1. Synthetic Authentication Token
  console.log('Step 1: Synthetic Vendor Authentication');
  const token = generateToken({ id: mockUserId, role: 'VENDOR' });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log('✅ Authenticated session established for synthetic vendor');

  // 2. Natural Language Intake Analysis (Voice/Text)
  console.log('\nStep 2: Natural Language Intake Analysis');
  const intakeRes = await fetch(`${baseUrl}/api/v1/intake/analyze`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      rawTranscript: 'Main chai aur garam samosa ka thela lagata hoon station road pe.',
      language: 'hinglish',
    }),
  });
  assert.strictEqual(intakeRes.status, 200);
  const intakeData = await intakeRes.json() as any;
  const applicationId = intakeData.data.applicationId;
  assert(applicationId, 'Must return valid applicationId');
  console.log(`✅ Application created via AI Intake pipeline. Application ID: ${applicationId}`);

  // Verify status is AI_PROCESSED
  const app1 = applicationsMap.get(applicationId);
  assert.strictEqual(app1.status, 'AI_PROCESSED');
  console.log('✅ Application state transitioned to: AI_PROCESSED');

  // 3. User Review Confirmation
  console.log('\nStep 3: User Review Confirmation');
  const reviewRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      kind_of_business: 'tea_stall',
      food_categories: ['Tea & Hot Beverages', 'Fried Snacks / Samosa'],
      business_description: 'Station road daily tea and snack stall',
    }),
  });
  assert.strictEqual(reviewRes.status, 200);
  const app2 = applicationsMap.get(applicationId);
  assert.strictEqual(app2.status, 'USER_CONFIRMED');
  console.log('✅ Application state transitioned to: USER_CONFIRMED');

  // 4. Deterministic Eligibility Check
  console.log('\nStep 4: Deterministic Statutory Eligibility Check');
  const eligRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/check-eligibility`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert.strictEqual(eligRes.status, 200);
  const eligData = await eligRes.json() as any;
  assert.strictEqual(eligData.data.eligibility.fee, 100);
  assert.strictEqual(eligData.data.eligibility.path, 'basic_registration');
  const app3 = applicationsMap.get(applicationId);
  assert.strictEqual(app3.status, 'ELIGIBILITY_CHECKED');
  console.log('✅ Application state transitioned to: ELIGIBILITY_CHECKED (₹100 Basic Registration)');

  // 5. Hygiene Checklist Query
  console.log('\nStep 5: Querying Controlled Schedule 4 Hygiene Checklist');
  const checklistRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/hygiene`, {
    headers: authHeaders,
  });
  assert.strictEqual(checklistRes.status, 200);
  const checklistData = await checklistRes.json() as any;
  assert(checklistData.data.items.length >= 6);
  console.log(`✅ Retrieved ${checklistData.data.items.length} controlled Schedule 4 hygiene items`);

  // 6. Complete Hygiene Checklist
  console.log('\nStep 6: Completing Hygiene Self-Audit Checklist');
  const completeHygieneRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/hygiene`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      completedItemIds: ['HY001', 'HY002', 'HY003', 'HY004', 'HY005', 'HY006'],
    }),
  });
  assert.strictEqual(completeHygieneRes.status, 200);
  const app4 = applicationsMap.get(applicationId);
  assert.strictEqual(app4.status, 'HYGIENE_GENERATED');
  console.log('✅ Application state transitioned to: HYGIENE_GENERATED (100% compliance audit)');

  // 7. Synthetic Document Upload & Confirmation
  console.log('\nStep 7: Synthetic Document Attachment');
  const docRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/document`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      documentTitle: 'Demo Stall Premise Photo',
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      mimeType: 'image/png',
      isSynthetic: true,
    }),
  });
  assert.strictEqual(docRes.status, 200);
  const docData = await docRes.json() as any;
  assert(docData.data.document.applicationRefNumber.startsWith('SYN-DOC-'));
  console.log(`✅ Synthetic premise document recorded with ref: ${docData.data.document.applicationRefNumber}`);

  // 8. Simulated ₹100 Payment
  console.log('\nStep 8: Simulating Prototype Fee Payment');
  const payRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/payment/simulate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ amount: 9999 }), // backend must strictly override to 100
  });
  assert.strictEqual(payRes.status, 200);
  const payData = await payRes.json() as any;
  assert.strictEqual(payData.data.amount, 100);
  assert.strictEqual(payData.data.status, 'SIMULATED_SUCCESS');
  const app5 = applicationsMap.get(applicationId);
  assert.strictEqual(app5.status, 'PAYMENT_SIMULATED');
  console.log('✅ Application state transitioned to: PAYMENT_SIMULATED (₹100 Mock Payment Recorded)');

  // 9. Synthetic Vendor Pass Generation
  console.log('\nStep 9: Generating Synthetic Vendor Pass & QR Code');
  const passRes = await fetch(`${baseUrl}/api/v1/applications/${applicationId}/pass`, {
    method: 'POST',
    headers: authHeaders,
  });
  assert.strictEqual(passRes.status, 200);
  const passData = await passRes.json() as any;
  const pass = passData.data;
  assert(pass.passId.startsWith('VPR-2026-'));
  assert(pass.syntheticReferenceId.startsWith('SYN-FSSAI-'));
  assert.strictEqual(pass.prototypeStatus, 'PROTOTYPE');
  assert.strictEqual(pass.qrPayload.type, 'DEMO_VENDOR_PASS');

  // Verify FINAL STATUS IS COMPLETED
  const finalApp = applicationsMap.get(applicationId);
  assert.strictEqual(finalApp.status, 'COMPLETED');
  console.log(`✅ Final Application state transitioned to: ${finalApp.status}`);

  // 10. Prototype Pass Verification
  console.log('\nStep 10: Public Prototype Pass Verification');
  const verifyRes = await fetch(`${baseUrl}/api/v1/vendor-pass/${pass.passId}`);
  assert.strictEqual(verifyRes.status, 200);
  const verifyData = await verifyRes.json() as any;
  assert.strictEqual(verifyData.data.passId, pass.passId);
  assert.strictEqual(verifyData.data.isPrototype, true);
  console.log('✅ Prototype verification endpoint validated synthetic pass with status 200');

  // Clean up
  (User as any).findById = originalUserFindById;
  (Application as any).create = originalAppCreate;
  (Application as any).findById = originalAppFindById;
  (Payment as any).create = originalPaymentCreate;
  (Payment as any).findOne = originalPaymentFindOne;
  (VendorPass as any).create = originalPassCreate;
  (VendorPass as any).findOne = originalPassFindOne;
  server.close();

  console.log('\n🏆 COMPLETE END-TO-END DEMO FLOW PASSED WITH FLYING COLORS!');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ E2E test failed:', err);
  process.exit(1);
});