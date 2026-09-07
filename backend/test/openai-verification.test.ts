import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { AIService } from '../src/services/ai.service';
import { env } from '../src/config/env';
import { getOpenAIClient } from '../src/ai/openai.client';
import { businessExtractionSchema } from '../src/ai/schemas/business.schema';

async function runOpenAIVerification() {
  console.log('🧪 Starting OpenAI Final Integration Verification Suite...\n');

  // Test 1: Missing API key → Mock Mode
  console.log('Test 1: Verifying missing API key triggers fallback mock mode');
  const originalApiKey = env.OPENAI_API_KEY;
  (env as any).OPENAI_API_KEY = undefined;

  const mockExtraction = await AIService.extractBusinessData(
    'Main chai aur samosa ka thela chalata hoon.'
  );
  assert.strictEqual(mockExtraction.isMock, true, 'isMock must be true when API key is missing');
  assert.strictEqual(mockExtraction.data.kind_of_business, 'tea_stall');
  assert(mockExtraction.data.food_categories.includes('Tea & Hot Beverages'));
  assert(Array.isArray(mockExtraction.data.missing_information));
  console.log('✅ Missing API key triggers deterministic mock mode with valid Zod schema');

  // Test 2: Configured API key → Real OpenAI path
  console.log('\nTest 2: Verifying configured API key activates OpenAI client');
  (env as any).OPENAI_API_KEY = 'sk-mock-valid-format-key-for-testing-purposes-only';
  const client = getOpenAIClient();
  assert(client !== null, 'OpenAI client must be initialized when API key is set');
  assert.strictEqual(typeof client.chat.completions.create, 'function');
  console.log('✅ Configured API key initializes OpenAI SDK client with chat.completions.create');

  // Restore env
  (env as any).OPENAI_API_KEY = originalApiKey;

  // Test 3: Malformed AI output → Rejected by Zod
  console.log('\nTest 3: Verifying malformed/invalid AI outputs are rejected by Zod');
  const invalidOutputs = [
    { kind_of_business: 'illegal_unsupported_business' }, // invalid enum
    { kind_of_business: 'tea_stall', food_categories: 'not_an_array' }, // invalid type
    { kind_of_business: 'tea_stall', food_categories: [] }, // empty food categories if required
    null,
    { arbitrary_key: 123 },
  ];

  for (const badOutput of invalidOutputs) {
    let failed = false;
    try {
      businessExtractionSchema.parse(badOutput);
    } catch (zodErr) {
      failed = true;
    }
    assert(failed, `Malformed output should have been rejected by Zod: ${JSON.stringify(badOutput)}`);
  }
  console.log('✅ All malformed AI outputs are strictly rejected by Zod schema before database write');

  // Test 4: No OPENAI_API_KEY appears in frontend source code
  console.log('\nTest 4: Verifying zero exposure of OPENAI_API_KEY in frontend source');
  const frontendDir = path.resolve(__dirname, '../../frontend/src');

  function checkDirForApiKey(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDirForApiKey(fullPath);
      } else if (/\.(ts|tsx|js|jsx|json|env)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(
          !content.includes('OPENAI_API_KEY'),
          `Security violation: OPENAI_API_KEY found in frontend file: ${fullPath}`
        );
        assert(
          !content.includes('NEXT_PUBLIC_OPENAI'),
          `Security violation: NEXT_PUBLIC_OPENAI found in frontend file: ${fullPath}`
        );
      }
    }
  }

  checkDirForApiKey(frontendDir);
  console.log('✅ Audited all frontend source files: ZERO occurrences of OPENAI_API_KEY or NEXT_PUBLIC_OPENAI');

  console.log('\n🎉 ALL OPENAI INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runOpenAIVerification().catch((err) => {
  console.error('❌ OpenAI verification test failed:', err);
  process.exit(1);
});