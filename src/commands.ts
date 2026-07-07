/**
 * commands.ts — Slash-command definitions + handlers.
 *
 * `definitions` is the JSON registered with Discord. `handlers` maps a command
 * name to an async function that calls one SDK method (via the data layer) and
 * replies with a branded embed. The shell in index.ts just routes to these.
 */

import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { td, MOCK_MODE } from './data.js';
import {
  earningsEmbed,
  flowEmbed,
  gexEmbed,
  ivEmbed,
  screenerEmbed,
  vitalsEmbed,
} from './embeds.js';

export const definitions: RESTPostAPIApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder().setName('vitals').setDescription('Market-wide options-flow vitals'),
  new SlashCommandBuilder()
    .setName('flow')
    .setDescription('Smart-money unusual options flow')
    .addStringOption((o) => o.setName('ticker').setDescription('Filter to one ticker (optional)')),
  new SlashCommandBuilder()
    .setName('gex')
    .setDescription('Gamma-exposure snapshot for a ticker')
    .addStringOption((o) => o.setName('ticker').setDescription('Ticker symbol').setRequired(true)),
  new SlashCommandBuilder()
    .setName('iv')
    .setDescription('IV rank / percentile for a ticker')
    .addStringOption((o) => o.setName('ticker').setDescription('Ticker symbol').setRequired(true)),
  new SlashCommandBuilder()
    .setName('screener')
    .setDescription('Run a named TraderDaddy screener')
    .addStringOption((o) => o.setName('name').setDescription('Screener id (e.g. csp-wheel)').setRequired(true)),
  new SlashCommandBuilder()
    .setName('earnings')
    .setDescription('Pre-earnings options flow for the upcoming window'),
].map((c) => c.toJSON());

type Handler = (i: ChatInputCommandInteraction) => Promise<void>;

export const handlers: Record<string, Handler> = {
  async vitals(i) {
    await i.deferReply();
    const s = await td.marketStats();
    await i.editReply({ embeds: [vitalsEmbed(s, MOCK_MODE)] });
  },

  async flow(i) {
    await i.deferReply();
    const ticker = i.options.getString('ticker') ?? undefined;
    const ua = await td.unusualActivity({ ...(ticker ? { ticker } : {}), limit: 8 });
    await i.editReply({ embeds: [flowEmbed(ua, ticker, MOCK_MODE)] });
  },

  async gex(i) {
    await i.deferReply();
    const ticker = i.options.getString('ticker', true).toUpperCase();
    const g = await td.gexTicker(ticker);
    await i.editReply({ embeds: [gexEmbed(g, MOCK_MODE)] });
  },

  async iv(i) {
    await i.deferReply();
    const ticker = i.options.getString('ticker', true).toUpperCase();
    const iv = await td.ivRank(ticker);
    await i.editReply({ embeds: [ivEmbed(iv, MOCK_MODE)] });
  },

  async screener(i) {
    await i.deferReply();
    const name = i.options.getString('name', true);
    const sr = await td.runScreener(name, { limit: 12 });
    await i.editReply({ embeds: [screenerEmbed(sr, MOCK_MODE)] });
  },

  async earnings(i) {
    await i.deferReply();
    const ef = await td.earningsFlow({ days: 7 });
    await i.editReply({ embeds: [earningsEmbed(ef, MOCK_MODE)] });
  },
};
