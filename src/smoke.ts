/**
 * smoke.ts — Offline end-to-end check (no Discord token, no API key).
 *
 * Builds every command embed and one alert embed against keyless SDK fixtures,
 * then prints a one-line summary per embed. This exercises the whole
 * SDK → data → embed path — if the SDK shape were wrong, this would fail to
 * typecheck or throw here. Run with `npm run smoke`.
 */

import { TraderDaddy } from '@traderdaddy/sdk';
import {
  earningsEmbed,
  flowEmbed,
  gexEmbed,
  ivEmbed,
  screenerEmbed,
  vitalsEmbed,
  alertEmbed,
} from './embeds.js';

const td = new TraderDaddy({ mock: true });

function line(label: string, embed: { data: { title?: string; fields?: unknown[]; description?: string } }): void {
  const t = embed.data.title ?? '(no title)';
  const fields = embed.data.fields?.length ?? 0;
  const desc = embed.data.description ? `${embed.data.description.slice(0, 60).replace(/\n/g, ' ')}…` : '';
  console.log(`✓ ${label.padEnd(10)} → "${t}"  (${fields} fields)  ${desc}`);
}

async function main(): Promise<void> {
  console.log('DaddyBot smoke test — keyless demo fixtures\n');

  line('vitals', vitalsEmbed(await td.marketStats(), true));

  const ua = await td.unusualActivity({ limit: 8 });
  line('flow', flowEmbed(ua, undefined, true));
  line('flow NVDA', flowEmbed(await td.unusualActivity({ ticker: 'NVDA', limit: 8 }), 'NVDA', true));

  line('gex', gexEmbed(await td.gexTicker('NVDA'), true));
  line('iv', ivEmbed(await td.ivRank('TSLA'), true));
  line('screener', screenerEmbed(await td.runScreener('csp-wheel', { limit: 12 }), true));
  line('earnings', earningsEmbed(await td.earningsFlow({ days: 7 }), true));

  // Alert path: pick the first LEGENDARY/ELITE row, exactly as the loop does.
  const alertRow = ua.data.find((r) => ['ELITE', 'LEGENDARY'].includes(r.tier.toUpperCase())) ?? ua.data[0];
  if (alertRow) line('alert', alertEmbed(alertRow, true));

  console.log('\nAll embeds built successfully.');
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
