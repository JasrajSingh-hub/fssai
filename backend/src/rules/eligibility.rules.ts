import { BusinessType } from '../ai/schemas/business.schema';

export interface BusinessEligibilityInput {
  kind_of_business: BusinessType;
  food_categories: string[];
  annual_turnover_estimated?: number;
}

export interface EligibilityResult {
  path: 'basic_registration' | 'state_license';
  fee: number;
  currency: 'INR';
  isPrototype: boolean;
  message: string;
  disclaimer: string;
  criteriaNotes: string[];
}

/**
 * Deterministic rules engine for hackathon prototype.
 * NOTE: OpenAI does NOT make eligibility decisions.
 * This deterministic rules engine determines the prototype pathway.
 * This is an independent civic UX prototype and not an official government determination.
 */
export const evaluateEligibilityRule = (
  input: BusinessEligibilityInput
): EligibilityResult => {
  const pettyBusinessTypes: BusinessType[] = [
    'tea_stall',
    'street_food_vendor',
    'hawker',
    'home_kitchen',
    'petty_food_retailer',
  ];

  const estimatedTurnover = input.annual_turnover_estimated ?? 150000; // Default assumption for micro/street vendors
  const isPetty = pettyBusinessTypes.includes(input.kind_of_business);
  const isUnderTurnoverCap = estimatedTurnover <= 1200000; // 12 Lakhs annual turnover cap for Petty FBO

  if (isPetty && isUnderTurnoverCap) {
    return {
      path: 'basic_registration',
      fee: 100,
      currency: 'INR',
      isPrototype: true,
      message: 'Prototype Basic Registration pathway',
      disclaimer: 'Independent Civic UX Prototype — This is not an official FSSAI registration.',
      criteriaNotes: [
        `Identified business type: ${input.kind_of_business.replace('_', ' ')}`,
        'Qualifies as Petty Food Business Operator (Turnover <= ₹12 Lakhs/year)',
        'Statutory prototype fee simulation: ₹100',
      ],
    };
  }

  // Fallback for larger scale or unknown
  return {
    path: 'basic_registration',
    fee: 100,
    currency: 'INR',
    isPrototype: true,
    message: 'Prototype Basic Registration pathway',
    disclaimer: 'Independent Civic UX Prototype — This is not an official FSSAI registration.',
    criteriaNotes: [
      `Assigned to Basic Registration demo pathway for hackathon MVP evaluation`,
    ],
  };
};