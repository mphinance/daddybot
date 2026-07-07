/**
 * alerts.ts — Scheduled unusual-activity alert loop.
 *
 * Gate on the SDK's market clock, poll the flow tape, dedupe on each row's real
 * unique `id`, keep only the loud tiers, and post one embed per fresh print to
 * the configured channel. The SDK backs off on 429 automatically, so a missed
 * tick self-heals on the next one.
 */

import type { Client, SendableChannels } from 'discord.js';
import { td, isMarketOpen, MOCK_MODE } from './data.js';
import { getAlertConfig, type AlertConfig } from './config.js';
import { alertEmbed } from './embeds.js';

/** Cap the dedupe set so a long-running process doesn't grow unbounded. */
const SEEN_CAP = 2000;

function remember(seen: Set<string>, id: string): void {
  seen.add(id);
  if (seen.size > SEEN_CAP) {
    // Drop the oldest ~half (insertion order) to bound memory.
    const drop = [...seen].slice(0, seen.size - SEEN_CAP / 2);
    for (const k of drop) seen.delete(k);
  }
}

async function resolveChannel(client: Client, channelId: string): Promise<SendableChannels | null> {
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (channel?.isSendable()) return channel;
  return null;
}

async function pollOnce(client: Client, cfg: AlertConfig, seen: Set<string>): Promise<void> {
  if (!cfg.channelId) return;
  if (!MOCK_MODE && !isMarketOpen()) return; // demo mode always ticks so it's demoable

  const channel = await resolveChannel(client, cfg.channelId);
  if (!channel) {
    console.warn(`[alerts] channel ${cfg.channelId} not found or not text-based`);
    return;
  }

  const { data } = await td.unusualActivity({ minPremium: cfg.minPremium, limit: 25 });
  for (const row of data) {
    if (seen.has(row.id)) continue;
    if (!cfg.minTiers.has(row.tier.toUpperCase())) continue;
    remember(seen, row.id);
    await channel.send({ embeds: [alertEmbed(row, MOCK_MODE)] });
  }
}

/** Start the alert loop. No-op (returns) if no ALERT_CHANNEL_ID is configured. */
export function startAlertLoop(client: Client): void {
  const cfg = getAlertConfig();
  if (!cfg.channelId) {
    console.log('[alerts] disabled — set ALERT_CHANNEL_ID to enable');
    return;
  }
  const seen = new Set<string>();
  console.log(
    `[alerts] enabled → channel ${cfg.channelId}, every ${cfg.intervalMs}ms, ` +
      `min premium ${cfg.minPremium}, tiers [${[...cfg.minTiers].join(', ')}]`,
  );
  const tick = (): void => {
    pollOnce(client, cfg, seen).catch((err) => console.error('[alerts] poll failed:', err));
  };
  tick(); // fire once on boot
  setInterval(tick, cfg.intervalMs);
}
