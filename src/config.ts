/**
 * config.ts — Environment configuration.
 *
 * The bot runs in one of two data modes, decided by whether a TraderDaddy key is
 * present: with `TD_API_KEY` it hits the live API, without it the SDK serves
 * typed demo fixtures (keyless). Discord credentials are always required to
 * connect; `getDiscordConfig()` validates them lazily so the smoke test can run
 * without a token.
 */

export interface DiscordConfig {
  token: string;
  clientId: string;
  /** Optional dev guild — commands registered here appear instantly. */
  guildId?: string;
}

export interface AlertConfig {
  channelId?: string;
  intervalMs: number;
  minPremium: number;
  /** Only tiers in this set are posted (loud prints only). */
  minTiers: Set<string>;
}

/** The server owner's own `td_live_` key, or undefined for keyless demo mode. */
export const TD_API_KEY = process.env.TD_API_KEY?.trim() || undefined;

/** True when no key is set — the SDK runs against fixtures. */
export const MOCK_MODE = !TD_API_KEY;

/** Validate and return the Discord credentials needed to connect / register. */
export function getDiscordConfig(): DiscordConfig {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const missing: string[] = [];
  if (!token) missing.push('DISCORD_BOT_TOKEN');
  if (!clientId) missing.push('DISCORD_CLIENT_ID');
  if (missing.length) {
    throw new Error(
      `Missing required env var(s): ${missing.join(', ')}. ` +
        'See .env.example.',
    );
  }
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  return { token: token!, clientId: clientId!, ...(guildId ? { guildId } : {}) };
}

const DEFAULT_TIERS = ['ELITE', 'LEGENDARY'];

/** Alert-loop tuning. All optional — alerts are off unless a channel is set. */
export function getAlertConfig(): AlertConfig {
  const channelId = process.env.ALERT_CHANNEL_ID?.trim();
  const intervalMs = Number(process.env.ALERT_INTERVAL ?? 60_000);
  const minPremium = Number(process.env.ALERT_MIN_PREMIUM ?? 250_000);
  const tiers = process.env.ALERT_MIN_TIERS?.trim()
    ? process.env.ALERT_MIN_TIERS.split(',').map((t) => t.trim().toUpperCase())
    : DEFAULT_TIERS;
  return {
    ...(channelId ? { channelId } : {}),
    intervalMs: Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 60_000,
    minPremium: Number.isFinite(minPremium) && minPremium >= 0 ? minPremium : 250_000,
    minTiers: new Set(tiers),
  };
}
