import {
  evaluateEligibilityRule,
  EligibilityResult,
  BusinessEligibilityInput,
} from '../rules/eligibility.rules';
import { AppError } from '../utils/appError';

export class EligibilityService {
  /**
   * Deterministically evaluates prototype pathway for an application.
   * OpenAI is NOT used here; this runs strict rule evaluation.
   */
  static evaluate(businessData: {
    kind_of_business?: string;
    food_categories?: string[];
    annual_turnover_estimated?: number;
  }): EligibilityResult {
    if (!businessData.kind_of_business) {
      throw AppError.badRequest(
        'Cannot check eligibility: kind_of_business is missing from confirmed application'
      );
    }

    const input: BusinessEligibilityInput = {
      kind_of_business: businessData.kind_of_business as any,
      food_categories: businessData.food_categories || [],
      annual_turnover_estimated: businessData.annual_turnover_estimated,
    };

    return evaluateEligibilityRule(input);
  }
}