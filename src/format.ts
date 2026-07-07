/**
 * format.ts — Presentation helpers + brand constants.
 *
 * Pure functions: number/premium formatting, safe colour resolution, and the
 * TraderDaddy Pro brand bits every embed shares. No SDK imports here.
 */

import type { ColorResolvable } from 'discord.js';

export const BRAND = {
  name: 'TraderDaddy Pro',
  url: 'https://traderdaddy.pro',
  color: '#5865F2' as ColorResolvable,
  bullish: '#22c55e' as ColorResolvable,
  bearish: '#ef4444' as ColorResolvable,
  neutral: '#64748b' as ColorResolvable,
};

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Trust a `#rrggbb` string from the API; fall back to brand colour otherwise. */
export function resolveColor(hex: string | undefined | null): ColorResolvable {
  return hex && HEX6.test(hex) ? (hex as ColorResolvable) : BRAND.color;
}

/** Colour by sentiment word (Bullish/Bearish/…); default neutral. */
export function sentimentColor(sentiment: string): ColorResolvable {
  const s = sentiment.toLowerCase();
  if (s.includes('bull')) return BRAND.bullish;
  if (s.includes('bear')) return BRAND.bearish;
  return BRAND.neutral;
}

/** $3,840,000 → "$3.84M"; compact premium formatting. */
export function premium(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

/** Signed billions for GEX values, e.g. 4.8e9 → "+4.80B". */
export function gexB(n: number): string {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}${(Math.abs(n) / 1e9).toFixed(2)}B`;
}

/** 1.85 → "+1.85%"; signed percentage. */
export function pct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

/** Round a plain number with grouping, e.g. 128.45 → "128.45". */
export function num(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const TYPE_EMOJI: Record<string, string> = { CALL: '🟢', PUT: '🔴' };

/** Emoji marker for CALL/PUT. */
export function typeEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '⚪';
}
