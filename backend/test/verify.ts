import assert from 'assert';
import { registerSchema, loginSchema } from '../src/validators/auth.validator';
import { generateToken, verifyToken } from '../src/utils/jwt';
import { AppError } from '../src/utils/appError';
import { APPLICATION_STATUSES, Application } from '../src/models/application.model';
import { Payment } from '../src/models/payment.model';
import { VendorPass } from '../src/models/vendorPass.model';
import { User } from '../src/models/user.model';
import app from '../src/app';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Phase 1 Backend Verification Suite...\n');

  // Test 1: JWT generation and verification
  console.log('Test 1: JWT token generation and verification');
  const token = generateToken({ id: 'user_123', role: 'VENDOR' });
  assert(typeof token === 'string', 'Token must be a string');
  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, 'user_123');
  assert.strictEqual(decoded.role, 'VENDOR');
  console.log('✅ JWT verification passed');

  // Test 2: Zod Register Validator
  console.log('\nTest 2: Zod Register Validator');
  const validRegister = registerSchema.safeParse({
    body: {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      password: 'password123',
      businessName: 'Ramesh Chaat Corner',
      role: 'VENDOR',
    },
  });
  assert(validRegister.success === true, 'Valid register data should pass');

  const invalidRegister = registerSchema.safeParse({
    body: {
      name: 'R',
      phone: '123', // too short
      password: '123', // too short
    },
  });
  assert(invalidRegister.success === false, 'Invalid register data should fail');
  console.log('✅ Zod Register validation passed');

  // Test 3: Zod Login Validator
  console.log('\nTest 3: Zod Login Validator');
  const validLogin = loginSchema.safeParse({
    body: {
      phone: '9876543210',
      password: 'password123',
    },
  });
  assert(validLogin.success === true, 'Valid login should pass');
  console.log('✅ Zod Login validation passed');

  // Test 4: Application Statuses Enum
  console.log('\nTest 4: Application Statuses Enum Verification');
  const requiredStatuses = [
    'DRAFT',
    'VOICE_CAPTURED',
    'AI_PROCESSED',
    'REVIEW_PENDING',
    'USER_CONFIRMED',
    'ELIGIBILITY_CHECKED',
    'HYGIENE_GENERATED',
    'PAYMENT_PENDING',
    'PAYMENT_SIMULATED',
    'PASS_GENERATED',
    'COMPLETED',
  ];
  for (const status of requiredStatuses) {
    assert(
      (APPLICATION_STATUSES as readonly string[]).includes(status),
      `Missing required status: ${status}`
    );
  }
  console.log(`✅ All ${requiredStatuses.length} required Application statuses are present`);

  // Test 5: Model Schemas Verification
  console.log('\nTest 5: Model Schemas Verification');
  assert(User.modelName === 'User', 'User model registered');
  assert(Application.modelName === 'Application', 'Application model registered');
  assert(Payment.modelName === 'Payment', 'Payment model registered');
  assert(VendorPass.modelName === 'VendorPass', 'VendorPass model registered');
  console.log('✅ All 4 Mongoose models (User, Application, Payment, VendorPass) successfully loaded');

  // Test 6: App Error handling
  console.log('\nTest 6: Centralized AppError handling');
  const err = AppError.badRequest('Invalid input data', [{ field: 'phone', message: 'Too short' }]);
  assert.strictEqual(err.statusCode, 400);
  assert.strictEqual(err.status, 'fail');
  assert.strictEqual(err.details[0].field, 'phone');
  console.log('✅ AppError structure passed');

  // Test 7: HTTP App Health & Endpoint Validation via Node HTTP
  console.log('\nTest 7: Express App Health & Zod Error handling over HTTP');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  // 7a. Health Check
  const healthRes = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
  const healthData = await healthRes.json() as any;
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthData.status, 'ok');
  console.log('✅ GET /api/v1/health returned 200 OK');

  // 7b. Register validation error handling (Zod bad request)
  const regRes = await fetch(`http://127.0.0.1:${port}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '123' }), // Missing name, password, invalid phone
  });
  const regData = await regRes.json() as any;
  assert.strictEqual(regRes.status, 400);
  assert.strictEqual(regData.success, false);
  assert(Array.isArray(regData.error.details), 'Validation details must be returned');
  console.log('✅ POST /api/v1/auth/register returned 400 with structured Zod errors');

  // 7c. 404 handler
  const notFoundRes = await fetch(`http://127.0.0.1:${port}/api/v1/nonexistent`);
  assert.strictEqual(notFoundRes.status, 404);
  console.log('✅ 404 Catch-all route returned 404 Not Found');

  server.close();

  console.log('\n🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});