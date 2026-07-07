# DaddyBot

> A self-hostable **Discord bot** that posts TraderDaddy Pro smart-money
> options-flow alerts to your own server.

**Status:** ✅ Built (v0.1.0) — six slash commands + a scheduled alert loop, on
[`@traderdaddy/sdk`](https://github.com/mphinance/traderdaddy-sdk). Runs keyless
in demo mode out of the box; add your own `td_live_` key to go live.

Part of the [TraderDaddy Pro](https://traderdaddy.pro) open-source family, alongside
[DaddyBoard](https://github.com/mphinance/daddyboard) (the reference SDK consumer).

**Customizing it?** Grab a prompt from [`PROMPTS.md`](PROMPTS.md) and paste it into
Claude Code / Cursor. Agents working in this repo should read [`CLAUDE.md`](CLAUDE.md).

---

## Why this exists

Trading-community leaders run Discord servers. DaddyBot lets them drop live
smart-money flow into *their own* channels — which means they deploy your brand
and evangelize the platform to their members for you. It's also the **thinnest
real SDK consumer**, so it doubles as the end-to-end proof that the SDK's shape
is right (see the SDK's
[`docs/BUILDING-APPS.md`](https://github.com/mphinance/traderdaddy-sdk/blob/main/docs/BUILDING-APPS.md#daddybot--chat--discord--slack-bot)).

## Quick start

```bash
npm install
cp .env.example .env      # fill in DISCORD_BOT_TOKEN + DISCORD_CLIENT_ID
npm run register          # register slash commands with Discord
npm start                 # boot the bot
```

Leave `TD_API_KEY` blank to run against **keyless demo fixtures** — every command
works immediately, footered `· demo data`. Add your own `td_live_` key when
you're ready to go live. Prove the whole path with no token at all:

```bash
npm run smoke             # builds every embed against fixtures, offline
```

## Slash commands

Each command is one SDK method rendered as a branded embed.

| Command | SDK call | Shows |
|---|---|---|
| `/vitals` | `td.marketStats()` | sentiment, put/call ratios, total/bull/bear flow, largest trade |
| `/flow [ticker]` | `td.unusualActivity({ ticker, limit: 8 })` | the smart-money tape; embed color from each print's `tierColor` |
| `/gex <ticker>` | `td.gexTicker(sym)` | net GEX, flip point, bias, top gamma walls |
| `/iv <ticker>` | `td.ivRank(sym)` | IV rank / percentile, 52w range, rich/cheap read |
| `/screener <name>` | `td.runScreener(name, { limit: 12 })` | a named screener's setups |
| `/earnings` | `td.earningsFlow({ days: 7 })` | pre-earnings flow for the upcoming window |

## Scheduled alerts

Opt-in per channel via env. The loop gates on the SDK's `isMarketOpen()`, polls
`unusualActivity()`, **dedupes on each print's real unique `id`**, keeps only the
loud tiers (`ELITE`/`LEGENDARY` by default), and posts one embed per fresh print
— colored by the print's `tierColor`. Set `ALERT_CHANNEL_ID` to enable; see
[`.env.example`](.env.example) for `ALERT_INTERVAL`, `ALERT_MIN_PREMIUM`,
`ALERT_MIN_TIERS`. The SDK backs off on 429 automatically, so a missed tick
self-heals.

## Architecture

The whole app is `@traderdaddy/sdk` + a thin discord.js shell. The transport,
429 backoff, and market-hours math all live in the SDK.

- Node ≥18 + `discord.js` v14 (`Guilds` intent, slash commands via the
  interactions API), TypeScript (ESM / NodeNext).
- [`src/data.ts`](src/data.ts) is the **only** place the SDK is instantiated
  (`mock: !TD_API_KEY`, `cache: true`, `backoff: true`); every other module
  imports `td` from there and never touches the SDK directly.
- [`src/embeds.ts`](src/embeds.ts) turns typed SDK responses into branded embeds;
  [`src/commands.ts`](src/commands.ts) maps each slash command to one method;
  [`src/alerts.ts`](src/alerts.ts) is the poll loop; [`src/index.ts`](src/index.ts)
  wires it together.

```
src/
  config.ts    env parsing + validation (Discord creds validated lazily)
  data.ts      the one TraderDaddy instance (mock-vs-live decided here)
  format.ts    premium/number/color helpers + brand constants
  embeds.ts    one embed builder per command + the alert embed
  commands.ts  slash-command definitions + handlers
  alerts.ts    scheduled unusual-activity alert loop
  register.ts  one-shot slash-command registration
  index.ts     client bootstrap + interaction router
  smoke.ts     offline end-to-end check (no token, no key)
```

## Configuration

All via env (see [`.env.example`](.env.example)):

| Var | Required | Purpose |
|---|---|---|
| `DISCORD_BOT_TOKEN` | yes | bot token |
| `DISCORD_CLIENT_ID` | yes | application id (for command registration) |
| `DISCORD_GUILD_ID` | no | register commands to one guild instantly (else global) |
| `TD_API_KEY` | no | your `td_live_` key; blank ⇒ keyless demo mode |
| `ALERT_CHANNEL_ID` | no | channel for scheduled alerts; blank ⇒ alerts off |
| `ALERT_INTERVAL` | no | poll interval ms (default 60000) |
| `ALERT_MIN_PREMIUM` | no | min single-print premium (default 250000) |
| `ALERT_MIN_TIERS` | no | tiers to post (default `ELITE,LEGENDARY`) |

## Key-safety model

**Personal-use / self-host.** The server owner supplies their own `td_live_` key
in the bot's environment. The key stays on their host, never appears in a Discord
message, and only talks to `api.traderdaddy.pro`. One key = one bot instance =
respects that key's rate limit. (Same personal-use pattern as DaddyBoard and
DaddyLens — see the SDK playbook's key-safety table.)

## Docker

```bash
docker build -t daddybot .
docker run --env-file .env daddybot
```

## Notes

- The SDK is pinned as `file:../traderdaddy-sdk` for local development. Once
  `@traderdaddy/sdk` publishes to npm, switch that dependency to `^0.1.0` and the
  Docker build stands alone.
- MCP tools used: `get_market_stats`, `get_unusual_activity`, `get_gex_ticker`,
  `get_iv_rank`, `run_screener`, `get_earnings_flow`.
