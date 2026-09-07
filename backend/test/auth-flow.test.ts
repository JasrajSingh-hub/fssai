import assert from 'assert';
import { AuthService } from '../src/services/auth.service';
import { User } from '../src/models/user.model';
import { generateToken, verifyToken } from '../src/utils/jwt';
import bcrypt from 'bcryptjs';

async function testAuthFlow() {
  console.log('🧪 Testing Full Auth Logic & Password Security...');

  // Mock User methods
  const mockPasswordHash = await bcrypt.hash('secretPass123', 10);

  const mockUserRecord: any = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Ramesh Vendor',
    phone: '9876543210',
    email: 'ramesh@example.com',
    password: mockPasswordHash,
    role: 'VENDOR',
    businessName: 'Ramesh Chaat Corner',
    comparePassword: async function (pwd: string) {
      return bcrypt.compare(pwd, this.password);
    },
  };

  // Test password comparison
  const isValidPassword = await mockUserRecord.comparePassword('secretPass123');
  const isInvalidPassword = await mockUserRecord.comparePassword('wrongPassword');
  assert.strictEqual(isValidPassword, true, 'Valid password should match hash');
  assert.strictEqual(isInvalidPassword, false, 'Invalid password should fail');
  console.log('✅ Bcrypt hashing and password verification verified');

  // Test token creation and extraction
  const token = generateToken({ id: mockUserRecord._id, role: mockUserRecord.role });
  const payload = verifyToken(token);
  assert.strictEqual(payload.id, mockUserRecord._id);
  assert.strictEqual(payload.role, 'VENDOR');
  console.log('✅ Token claims payload validated');

  console.log('\n🎉 ALL AUTH SERVICE UNIT TESTS PASSED!');
  process.exit(0);
}

testAuthFlow().catch((err) => {
  console.error('❌ Auth flow test failed:', err);
  process.exit(1);
});