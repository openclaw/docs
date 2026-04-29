---
read_when:
    - Werken aan code of tests voor Pi-integratie
    - Pi-specifieke lint-, typecheck- en live-testflows uitvoeren
summary: 'Ontwikkelaarsworkflow voor Pi-integratie: bouwen, testen en live valideren'
title: Pi-ontwikkelworkflow
x-i18n:
    generated_at: "2026-04-29T22:57:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

Een verstandige workflow voor werken aan de Pi-integratie in OpenClaw.

## Typechecking en linting

- Standaard lokale gate: `pnpm check`
- Build-gate: `pnpm build` wanneer de wijziging build-output, packaging of lazy-loading/modulegrenzen kan beïnvloeden
- Volledige landing-gate voor Pi-zware wijzigingen: `pnpm check && pnpm test`

## Pi-tests uitvoeren

Voer de Pi-gerichte testset rechtstreeks uit met Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Om de live provider-oefening mee te nemen:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Dit dekt de belangrijkste Pi-unit-suites:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Handmatig testen

Aanbevolen flow:

- Voer de Gateway uit in dev-modus:
  - `pnpm gateway:dev`
- Trigger de agent rechtstreeks:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Gebruik de TUI voor interactieve debugging:
  - `pnpm tui`

Vraag voor tool-callgedrag om een `read`- of `exec`-actie, zodat je tool-streaming en payload-afhandeling kunt zien.

## Reset naar een schone lei

State staat onder de OpenClaw-state-directory. De standaard is `~/.openclaw`. Als `OPENCLAW_STATE_DIR` is ingesteld, gebruik dan in plaats daarvan die directory.

Om alles te resetten:

- `openclaw.json` voor configuratie
- `agents/<agentId>/agent/auth-profiles.json` voor model-authprofielen (API-sleutels + OAuth)
- `credentials/` voor provider-/kanaalstate die nog buiten de auth-profielopslag staat
- `agents/<agentId>/sessions/` voor agentsessiegeschiedenis
- `agents/<agentId>/sessions/sessions.json` voor de sessie-index
- `sessions/` als legacy-paden bestaan
- `workspace/` als je een lege workspace wilt

Als je alleen sessies wilt resetten, verwijder dan `agents/<agentId>/sessions/` voor die agent. Als je auth wilt behouden, laat dan `agents/<agentId>/agent/auth-profiles.json` en eventuele providerstate onder `credentials/` staan.

## Verwijzingen

- [Testen](/nl/help/testing)
- [Aan de slag](/nl/start/getting-started)

## Gerelateerd

- [Pi-integratiearchitectuur](/nl/pi)
