# DaddyBot

> A self-hostable **Discord bot** that posts TraderDaddy Pro smart-money
> options-flow alerts to your own server.

**Status:** 🚧 Spec only — not built yet. This README is the build brief.

Part of the [TraderDaddy Pro](https://traderdaddy.pro) open-source family, alongside
[DaddyBoard](https://github.com/mphinance/daddyboard). Depends on
[traderdaddy-sdk](https://github.com/mphinance/traderdaddy-sdk).

---

## Why this exists

Trading-community leaders run Discord servers. DaddyBot lets them drop live
smart-money flow into *their own* channels — which means they deploy your brand
and evangelize the platform to their members for you. It's also the **thinnest
real SDK consumer**, so it doubles as the end-to-end proof that the SDK's shape
is right.

## What it does

- **Slash commands** for on-demand reads:
  `/flow [ticker]`, `/gex <ticker>`, `/iv <ticker>`, `/screener <name>`,
  `/vitals` (market stats). Rich embeds in DaddyBoard's dark style.
- **Scheduled alerts** (opt-in per channel): posts notable unusual-activity
  prints on an interval during market hours, with a dedupe key so the same print
  isn't posted twice.
- Every embed footers with **Powered by TraderDaddy Pro** + a link.

## Architecture

- Node + `discord.js` (v14), slash commands via the interactions API.
- Data through [`@traderdaddy/sdk`](https://github.com/mphinance/traderdaddy-sdk)
  — reuse its cache, 429 backoff, and `isMarketOpen()` for the scheduler.
- Config via env: `DISCORD_BOT_TOKEN`, `TD_API_KEY` (the server owner's own
  `td_live_` key), optional `ALERT_CHANNEL_ID`, `ALERT_INTERVAL`.
- Demo mode (`MOCK_MODE=true` → `@traderdaddy/sdk/mock`) so it runs and demos
  without a key.

## MCP tools used

`get_market_stats`, `get_unusual_activity`, `get_gex_ticker`, `get_iv_rank`,
`run_screener`, `get_earnings_flow`.

## Key-safety model

Personal/self-host: the server owner supplies their own `td_live_` key in the
bot's environment. The key stays on their host and only talks to
`api.traderdaddy.pro`. One key = one bot instance = respects that key's rate limit.

## Build milestones

1. Depend on `@traderdaddy/sdk`; bot scaffold + slash-command registration.
2. `/vitals` and `/flow` against demo data (proves the SDK path).
3. Remaining slash commands + branded embeds.
4. Scheduled alert loop: `isMarketOpen()` gate, poll `get_unusual_activity`,
   dedupe on a synthetic `TICKER__strike__expiry__side` key, post to channel.
5. Dockerfile + one-command `docker run` deploy; README with invite/permissions.

## Picking this up in a new session

Prereq: [`traderdaddy-sdk`](https://github.com/mphinance/traderdaddy-sdk). This is
the recommended first SDK consumer — if the SDK feels awkward to use here, fix the
SDK before building DaddyLens/DaddyEmbed on top of it. Start with demo mode, wire a
real key last.
