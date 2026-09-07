import assert from 'assert';
import { AIService } from '../src/services/ai.service';
import { businessExtractionSchema, ALLOWED_BUSINESS_TYPES } from '../src/ai/schemas/business.schema';
import { evaluateEligibilityRule } from '../src/rules/eligibility.rules';

async function testOpenAIPipeline() {
  console.log('🧪 Testing OpenAI Intake Pipeline and Deterministic Separation...\n');

  const transcript = 'Main chai aur samosa ka chhota thela chalata hoon.';
  const result = await AIService.extractBusinessData(transcript);

  console.log('Result source:', result.isMock ? 'Fallback Mock Parser' : 'Live OpenAI API (gpt-4o-mini)');
  console.log('Extracted data:', JSON.stringify(result.data, null, 2));

  // 1. Verify schema compliance
  const validated = businessExtractionSchema.parse(result.data);
  assert(ALLOWED_BUSINESS_TYPES.includes(validated.kind_of_business));
  assert(Array.isArray(validated.food_categories) && validated.food_categories.length > 0);
  assert(typeof validated.business_description === 'string');
  assert(typeof validated.language === 'string');
  assert(Array.isArray(validated.missing_information));
  console.log('✅ Extraction contains all required businessExtractionSchema fields');

  // 2. Verify OpenAI NEVER decides eligibility, fees, or approvals
  assert.strictEqual((result.data as any).eligible, undefined, 'OpenAI must not decide eligibility');
  assert.strictEqual((result.data as any).fee, undefined, 'OpenAI must not decide statutory fee');
  assert.strictEqual((result.data as any).approved, undefined, 'OpenAI must not grant government approval');
  assert.strictEqual((result.data as any).licenseNumber, undefined, 'OpenAI must not issue license');
  console.log('✅ Confirmed OpenAI output is strictly factual without regulatory or licensing decisions');

  // 3. Verify Deterministic Eligibility Engine makes the compliance decision
  const eligibility = evaluateEligibilityRule({
    turnover: 500000,
    kind_of_business: validated.kind_of_business,
    food_categories: validated.food_categories,
  });
  assert.strictEqual(eligibility.fee, 100);
  assert.strictEqual(eligibility.path, 'basic_registration');
  assert.strictEqual(eligibility.isPrototype, true);
  console.log('✅ Deterministic eligibility rules engine independently computed ₹100 Basic Registration');

  console.log('\n🎉 Real OpenAI / Fallback & Deterministic Engine separation verified!');
  process.exit(0);
}

testOpenAIPipeline().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});