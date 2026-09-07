import OpenAI from 'openai';
import { env } from '../config/env';

/**
 * Server-only OpenAI Client instance.
 * Instantiated only on the backend when OPENAI_API_KEY is configured in backend/.env.
 * Never exposed to frontend or client bundles.
 */
let clientInstance: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI | null => {
  if (!clientInstance && env.OPENAI_API_KEY) {
    clientInstance = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return clientInstance;
};