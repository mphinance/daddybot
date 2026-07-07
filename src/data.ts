/**
 * data.ts — The single place the SDK is instantiated.
 *
 * Everything else in the bot imports `td` from here and never touches
 * `@traderdaddy/sdk` directly. This is where mock-vs-live is decided and caching
 * is turned on, exactly as the SDK app playbook prescribes.
 */

import { TraderDaddy, isMarketOpen, getMarketPhase } from '@traderdaddy/sdk';
import { MOCK_MODE, TD_API_KEY } from './config.js';

export const td = new TraderDaddy({
  // Keyless demo unless the owner supplied their own key — the funnel default.
  mock: MOCK_MODE,
  ...(TD_API_KEY ? { apiKey: TD_API_KEY } : {}),
  // Many users asking the same question shouldn't each hit the API.
  cache: true,
  // Auto-retry on 429; the SDK handles the backoff math.
  backoff: true,
});

export { isMarketOpen, getMarketPhase, MOCK_MODE };
