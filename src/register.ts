/**
 * register.ts — Register slash commands with Discord (run once after changes).
 *
 * If DISCORD_GUILD_ID is set, registers to that guild (appears instantly — use
 * during development). Otherwise registers globally (can take up to an hour to
 * propagate). Run with `npm run register`.
 */

import './env.js';
import { REST, Routes } from 'discord.js';
import { getDiscordConfig } from './config.js';
import { definitions } from './commands.js';

async function main(): Promise<void> {
  const { token, clientId, guildId } = getDiscordConfig();
  const rest = new REST({ version: '10' }).setToken(token);

  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body: definitions });
  console.log(
    `Registered ${definitions.length} commands ${guildId ? `to guild ${guildId}` : 'globally'}.`,
  );
}

main().catch((err) => {
  console.error('Command registration failed:', err);
  process.exit(1);
});
