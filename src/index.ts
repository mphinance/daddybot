/**
 * index.ts — Bot entry point.
 *
 * Boots a discord.js client, routes chat-input interactions to the command
 * handlers, and starts the scheduled alert loop. The `Guilds` intent is all a
 * slash-command + channel-post bot needs.
 */

import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { getDiscordConfig } from './config.js';
import { MOCK_MODE } from './data.js';
import { handlers } from './commands.js';
import { startAlertLoop } from './alerts.js';

const { token } = getDiscordConfig();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag} — data mode: ${MOCK_MODE ? 'DEMO (no key)' : 'LIVE'}`);
  startAlertLoop(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const handler = handlers[interaction.commandName];
  if (!handler) return;

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`[cmd:${interaction.commandName}] failed:`, err);
    const content = 'Something went wrong fetching that. Try again shortly.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content }).catch(() => {});
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
