/**
 * embeds.ts — Branded embed builders, one per command + one for alerts.
 *
 * Each takes a typed SDK response and returns a discord.js EmbedBuilder. Every
 * embed shares the "Powered by TraderDaddy Pro" footer. Presentation only — no
 * network, no SDK calls.
 */

import { EmbedBuilder } from 'discord.js';
import type {
  EarningsFlow,
  GexTicker,
  IvRank,
  MarketStats,
  ScreenerResult,
  UnusualActivity,
  UnusualActivityRow,
} from '@traderdaddy/sdk';
import {
  BRAND,
  gexB,
  num,
  pct,
  premium,
  resolveColor,
  sentimentColor,
  typeEmoji,
} from './format.js';

function base(demo: boolean): EmbedBuilder {
  const suffix = demo ? ' · demo data' : '';
  return new EmbedBuilder().setFooter({ text: `Powered by ${BRAND.name}${suffix}` }).setTimestamp();
}

/** /vitals — market-wide snapshot. */
export function vitalsEmbed(s: MarketStats, demo: boolean): EmbedBuilder {
  const lt = s.largestTrade;
  return base(demo)
    .setColor(sentimentColor(s.overallSentiment))
    .setTitle('📊 Market Vitals')
    .setURL(BRAND.url)
    .setDescription(
      `**Sentiment:** ${s.overallSentiment} (${s.sentimentScore}) · ` +
        `**Dominant flow:** ${s.dominantFlow}`,
    )
    .addFields(
      {
        name: 'Put/Call Ratios',
        value: `SPY \`${s.putCallRatioSPY}\` · QQQ \`${s.putCallRatioQQQ}\` · IWM \`${s.putCallRatioIWM}\``,
        inline: false,
      },
      { name: 'Total Flow', value: premium(s.totalFlowPremium), inline: true },
      { name: 'Bullish', value: premium(s.totalBullishPremium), inline: true },
      { name: 'Bearish', value: premium(s.totalBearishPremium), inline: true },
      {
        name: 'Largest Trade',
        value: `${typeEmoji(lt.type)} **${lt.ticker}** ${lt.type} · ${premium(lt.premium)} · ${lt.tradeType} · score ${lt.score}`,
        inline: false,
      },
      { name: 'Active Alerts', value: String(s.activeAlerts), inline: true },
      { name: 'Market', value: s.marketOpen ? '🟢 Open' : '🔴 Closed', inline: true },
    );
}

/** One flow row → a compact line. */
function flowLine(r: UnusualActivityRow): string {
  return (
    `${typeEmoji(r.type)} **${r.ticker}** ${r.type} · ${premium(r.premium)} · ` +
    `\`${r.tier}\` · ${r.tradeType} · score ${r.score}\n` +
    `┗ ${r.flowDescription}`
  );
}

/** /flow — the smart-money tape (optionally ticker-filtered). */
export function flowEmbed(ua: UnusualActivity, ticker: string | undefined, demo: boolean): EmbedBuilder {
  const rows = ua.data;
  const title = ticker ? `💸 Unusual Flow — ${ticker.toUpperCase()}` : '💸 Unusual Options Flow';
  const embed = base(demo)
    .setColor(resolveColor(rows[0]?.tierColor))
    .setTitle(title)
    .setURL(BRAND.url);

  if (rows.length === 0) {
    return embed.setDescription(
      ticker ? `No notable flow on **${ticker.toUpperCase()}** right now.` : 'No notable flow right now.',
    );
  }

  embed.setDescription(rows.map(flowLine).join('\n\n'));
  const agg = ua.aggregates;
  embed.addFields(
    { name: 'Total Premium', value: premium(agg.totalPremium), inline: true },
    { name: 'Bull / Bear', value: `${agg.bullishCount} / ${agg.bearishCount}`, inline: true },
    { name: 'Top', value: `${agg.topTicker} ${premium(agg.topPremium)}`, inline: true },
  );
  return embed;
}

/** A single alert embed for one notable print. */
export function alertEmbed(r: UnusualActivityRow, demo: boolean): EmbedBuilder {
  return base(demo)
    .setColor(resolveColor(r.tierColor))
    .setTitle(`${typeEmoji(r.type)} ${r.tier} — ${r.ticker} ${r.type}`)
    .setDescription(r.flowDescription)
    .addFields(
      { name: 'Premium', value: premium(r.premium), inline: true },
      { name: 'Score', value: String(r.score), inline: true },
      { name: 'Type', value: r.tradeType, inline: true },
      { name: 'Sentiment', value: r.sentimentLabel, inline: true },
      { name: 'Vol / OI', value: `${num(r.volume)} / ${num(r.openInterest)}`, inline: true },
      { name: 'Moneyness', value: `${r.moneynessBucket} (${pct(r.moneynessPct)})`, inline: true },
    );
}

/** /gex — gamma-exposure snapshot for a ticker. */
export function gexEmbed(g: GexTicker, demo: boolean): EmbedBuilder {
  const longGamma = g.bias === 'LONG_GAMMA';
  const topWalls = [...g.byStrike]
    .sort((a, b) => Math.abs(b.netGex) - Math.abs(a.netGex))
    .slice(0, 5)
    .map((s) => `\`${s.strike}\` net ${gexB(s.netGex)}${s.isAboveSpot ? ' ▲' : ' ▼'}`)
    .join('\n');
  const embed = base(demo)
    .setColor(longGamma ? BRAND.bullish : BRAND.bearish)
    .setTitle(`🧲 Gamma Exposure — ${g.symbol}`)
    .setURL(BRAND.url)
    .addFields(
      { name: 'Net GEX', value: gexB(g.netGex), inline: true },
      { name: 'Flip Point', value: num(g.flipPoint), inline: true },
      { name: 'Bias', value: g.bias, inline: true },
      { name: 'Key Strikes', value: topWalls || '—', inline: false },
    )
    .setDescription(
      longGamma
        ? 'Dealers net **long gamma** — expect mean reversion, dampened moves.'
        : 'Dealers net **short gamma** — expect momentum, amplified moves.',
    );
  if (g.proxy) {
    embed.addFields({ name: 'Proxy', value: `${g.proxy.symbol} ×${g.proxy.scaleFactor}`, inline: true });
  }
  return embed;
}

/** /iv — IV rank / percentile for a ticker. */
export function ivEmbed(iv: IvRank, demo: boolean): EmbedBuilder {
  const color =
    iv.interpretation === 'rich' ? BRAND.bearish : iv.interpretation === 'cheap' ? BRAND.bullish : BRAND.neutral;
  return base(demo)
    .setColor(color)
    .setTitle(`🌡️ IV Rank — ${iv.symbol}`)
    .setURL(BRAND.url)
    .addFields(
      { name: 'IV Rank', value: String(iv.ivRank), inline: true },
      { name: 'IV %ile', value: String(iv.ivPercentile), inline: true },
      { name: 'Current IV', value: `${(iv.currentIV * 100).toFixed(1)}%`, inline: true },
      { name: '52w Range', value: `${(iv.ivMin52w * 100).toFixed(0)}%–${(iv.ivMax52w * 100).toFixed(0)}%`, inline: true },
      { name: 'Read', value: `\`${iv.interpretation}\``, inline: true },
    )
    .setDescription(iv.note);
}

/** /screener — a named screener's setups. */
export function screenerEmbed(sr: ScreenerResult, demo: boolean): EmbedBuilder {
  const embed = base(demo)
    .setColor(BRAND.color)
    .setTitle(`🔎 Screener — ${sr.screener.name}`)
    .setURL(BRAND.url);

  if (sr.results.length === 0) {
    return embed.setDescription(`No results for \`${sr.screener.id}\`.`);
  }
  embed.setDescription(
    sr.results
      .map((r) => {
        const setup = r.setup ? ` · ${r.setup}` : '';
        return `**${r.ticker}** ${num(r.price)} (${pct(r.changePct)}) · score ${r.score} · ${r.sector}${setup}`;
      })
      .join('\n'),
  );
  embed.setFooter({ text: `Powered by ${BRAND.name}${demo ? ' · demo data' : ''} · ${sr.returned}/${sr.count}` });
  return embed;
}

/** /earnings — pre-earnings flow for the upcoming window. */
export function earningsEmbed(ef: EarningsFlow, demo: boolean): EmbedBuilder {
  const embed = base(demo)
    .setColor(BRAND.color)
    .setTitle(`📅 Earnings Flow — next ${ef.days}d`)
    .setURL(BRAND.url);

  if (ef.earnings.length === 0) {
    return embed.setDescription('No earnings with notable flow in the window.');
  }
  embed.setDescription(
    ef.earnings
      .map((item) => {
        const e = item.event;
        return (
          `**${e.symbol}** · ${e.earningsDate} ${e.earningsTime} · ` +
          `exp move ±${e.expectedMovePct.toFixed(1)}%\n` +
          `┗ ${item.summary.direction} (${item.summary.confidence}) — ${item.summary.note}`
        );
      })
      .join('\n\n'),
  );
  return embed;
}
