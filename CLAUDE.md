# CLAUDE.md — agent ground-truth for DaddyBot

> Read this first. The short, factual map for working in this repo. Tool-agnostic
> — copy to `AGENTS.md` if you use Cursor/other.
>
> **Want to customize it by talking to your AI?** See [`PROMPTS.md`](PROMPTS.md).

## What this is

A self-hostable **Discord bot** that posts TraderDaddy Pro smart-money
options-flow to your own server. Six slash commands + a scheduled alert loop.
It's the thinnest real consumer of [`@traderdaddy/sdk`](https://github.com/mphinance/traderdaddy-sdk)
— the whole app is **SDK + a thin discord.js shell**. Runs keyless in demo mode.

## The one rule

`src/data.ts` is the **only** place the SDK is instantiated. Every other module
imports `td` from there and never touches `@traderdaddy/sdk` directly. That's
where mock-vs-live is decided and caching is turned on. Don't scatter
`new TraderDaddy(...)`.

## Repo map

| Path | What |
|---|---|
| `src/data.ts` | The one `TraderDaddy` instance. `mock: !TD_API_KEY, cache: true, backoff: true`. |
| `src/config.ts` | Env parsing + validation (Discord creds validated lazily). |
| `src/commands.ts` | Slash-command definitions + handlers — each maps to one SDK method. |
| `src/embeds.ts` | One embed builder per command + the alert embed. |
| `src/alerts.ts` | Scheduled `unusualActivity()` poll loop. |
| `src/format.ts` | Premium/number/color helpers + brand constants. |
| `src/register.ts` | One-shot slash-command registration with Discord. |
| `src/index.ts` | Client bootstrap + interaction router. |
| `src/smoke.ts` | Offline end-to-end check — no token, no key. |

## Commands

```bash
npm install
cp .env.example .env    # DISCORD_BOT_TOKEN + DISCORD_CLIENT_ID
npm run register        # register slash commands with Discord
npm start               # boot the bot
npm run dev             # tsx watch
npm run smoke           # offline: build every embed against fixtures (no token/key)
npm run typecheck       # tsc --noEmit
npm run build           # tsc → dist/
```

`npm run smoke` is the fastest way to see output — it renders every embed from
demo fixtures with no Discord connection and no key. Use it before touching
anything.

## Conventions (match these)

- **One command = one SDK method = one embed.** Adding a command → add its
  definition + handler in `commands.ts`, an embed builder in `embeds.ts`, and it
  calls exactly one `td.*` method. Keep it that thin.
- **Alerts dedupe on each print's real unique `id`** (`UnusualActivityRow.id`),
  and only *after* successful delivery — never a synthetic composite key.
- **Gate the poll loop on `isMarketOpen()`.** Don't poll overnight.
- **Color embeds by the print's `tierColor`**, filter by `tier`.
- **All config is env** (see `.env.example`). No hard-coded IDs or keys.

## Gotchas

- **Key safety: personal-use / self-host.** The owner's `td_live_` key lives in
  the host's env only — never in a Discord message, never committed. One key =
  one bot instance.
- **SDK dep is `file:../traderdaddy-sdk`** for local dev — the SDK's gitignored
  `dist/` must be built (`cd ../traderdaddy-sdk && npm run build`). When
  `@traderdaddy/sdk` publishes to npm, flip this to `^0.1.0` and the Dockerfile
  stands alone.
- **Don't re-implement transport/backoff/market-hours** — the SDK owns all of it.

## Where to look when unsure

- The SDK's shape + methods → [SDK README](https://github.com/mphinance/traderdaddy-sdk#methods)
- The app pattern this follows → [SDK BUILDING-APPS.md](https://github.com/mphinance/traderdaddy-sdk/blob/main/docs/BUILDING-APPS.md#daddybot--chat--discord--slack-bot)
- Prompts to customize this bot → [`PROMPTS.md`](PROMPTS.md)
