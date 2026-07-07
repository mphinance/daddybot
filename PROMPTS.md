# Prompt pack — make DaddyBot yours

DaddyBot is a self-host Discord bot for TraderDaddy Pro options-flow. You don't
need to be a TypeScript expert to customize it — pick a prompt, paste it into
your AI coding tool (Claude Code, Cursor, …) inside a clone of this repo, and let
it drive. Every prompt keeps the bot working in **keyless demo mode** so you can
test with `npm run smoke` before wiring up Discord or a key.

> **First, always:** tell your AI to read `CLAUDE.md` in this repo. It's the map.

---

## 1. Add a new slash command

```
I want to add a new slash command to this Discord bot. Read CLAUDE.md first and
follow its "one command = one SDK method = one embed" rule.

The command: [describe it — e.g. "/sectors that shows sector rotation"].

Steps:
1. Pick the matching SDK method from the SDK method table (linked in CLAUDE.md) —
   e.g. sectorFlow(), putCallRatios(), strategyIdeas(), gexOverview(), edgeXray(),
   economicCalendar().
2. Add the command definition + handler in src/commands.ts.
3. Add an embed builder in src/embeds.ts, matching the brand style of the others.
4. Make it work against demo fixtures. Then run `npm run smoke` and show me the
   output — no Discord token or key needed.

Show me the plan before editing. Don't add any other features.
```

---

## 2. Tune the flow alerts

```
I want to change how the scheduled alert loop behaves. Read CLAUDE.md and
src/alerts.ts first.

What I want: [e.g. "only alert on LEGENDARY prints over $1M premium" / "alert on
a specific list of tickers" / "post a compact one-line summary instead of an
embed"].

Rules to keep: it must still gate on isMarketOpen(), still dedupe on each print's
real unique `id` (and only after successful delivery), and stay configurable via
env vars in .env.example. Don't hard-code anything I'd want to change later.

Test it with `npm run smoke` (offline, no key). Explain what you changed.
```

---

## 3. Change the look of the embeds

```
Restyle the bot's Discord embeds. Read src/embeds.ts and src/format.ts first
(brand colors + helpers live in format.ts). Keep every command mapped to exactly
one SDK method — this is presentation only, don't change the data layer.

What I want: [e.g. "a tighter layout with emoji tier badges" / "match my
community's brand color #7c3aed"].

Run `npm run smoke` and show me each embed before/after. Don't touch data.ts.
```

---

## 4. Deploy it

```
Help me deploy this bot so it runs 24/7. Read CLAUDE.md and the README first
(there's a Dockerfile). Walk me through, as a beginner:
1. Getting a Discord bot token + client ID and filling in .env.
2. Running `npm run register` once, then `npm start` locally to confirm it works.
3. Deploying with Docker (or a host you recommend — ask me which I prefer).
4. Where my TD_API_KEY goes to flip from demo data to live — as an env var on the
   host, NEVER in code or a Discord message (personal-use key-safety, see CLAUDE.md).
Explain each step; don't assume I've done this before.
```

---

## 5. Contribute your improvement back

```
I made a change to this bot that others would want. Help me contribute it back as
a pull request. Read CLAUDE.md first and match its conventions.

Before we open the PR:
1. Run `npm run typecheck` and `npm run smoke` and fix anything red.
2. Make sure no token or key is committed (check .env is gitignored).
3. Help me write a clear commit message and open the PR against `main` on GitHub,
   describing what changed and why.
Explain each step so I learn the flow.
```

---

## Tips

- **Test with `npm run smoke` constantly** — it renders every embed from demo
  fixtures with no Discord connection and no key. Fast feedback.
- **Keep `src/data.ts` the only SDK instance.** If your AI adds
  `new TraderDaddy(...)` elsewhere, tell it to import `td` from `data.ts` instead.
- **Never paste your `td_live_` key into a Discord message or commit it.** It goes
  in the host's env only.
- **Stuck on the data shape?** The [SDK README](https://github.com/mphinance/traderdaddy-sdk#methods)
  lists every method and what it returns.
