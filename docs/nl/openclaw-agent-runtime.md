---
read_when:
    - Werken aan OpenClaw-agentruntimecode of -tests
    - Agent-runtime lint-, typecheck- en live-testflows uitvoeren
summary: 'Ontwikkelaarsworkflow voor de OpenClaw-agentruntime: bouwen, testen en livevalidatie'
title: OpenClaw-agentruntimeworkflow
x-i18n:
    generated_at: "2026-06-27T17:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Een verstandige workflow voor werken aan de OpenClaw-agentruntime in OpenClaw.

## Typecontrole en linting

- Standaard lokale gate: `pnpm check`
- Build-gate: `pnpm build` wanneer de wijziging build-uitvoer, packaging of lazy-loading-/modulegrenzen kan beïnvloeden
- Volledige landingsgate voor wijzigingen aan de agentruntime: `pnpm check && pnpm test`

## Agentruntimetests uitvoeren

Voer de agentruntime-testset direct uit met Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Om de live provider-oefening op te nemen:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Dit dekt de belangrijkste unit-suites voor de agentruntime:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Handmatig testen

Aanbevolen flow:

- Voer de Gateway uit in dev-modus:
  - `pnpm gateway:dev`
- Activeer de agent direct:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Gebruik de TUI voor interactief debuggen:
  - `pnpm tui`

Voor gedrag van tool-calls vraag je om een `read`- of `exec`-actie, zodat je toolstreaming en payloadverwerking kunt zien.

## Reset met schone lei

State staat onder de OpenClaw-state-directory. Standaard is dit `~/.openclaw`. Als `OPENCLAW_STATE_DIR` is ingesteld, gebruik dan in plaats daarvan die directory.

Alles resetten:

- `openclaw.json` voor configuratie
- `agents/<agentId>/agent/auth-profiles.json` voor model-auth-profielen (API-sleutels + OAuth)
- `credentials/` voor provider-/channel-state die nog buiten de auth-profielstore staat
- `agents/<agentId>/sessions/` voor agentsessiegeschiedenis
- `agents/<agentId>/sessions/sessions.json` voor de sessie-index
- `sessions/` als legacy-paden bestaan
- `workspace/` als je een lege workspace wilt

Als je alleen sessies wilt resetten, verwijder dan `agents/<agentId>/sessions/` voor die agent. Als je auth wilt behouden, laat dan `agents/<agentId>/agent/auth-profiles.json` en eventuele provider-state onder `credentials/` staan.

## Referenties

- [Testen](/nl/help/testing)
- [Aan de slag](/nl/start/getting-started)

## Gerelateerd

- [OpenClaw-architectuur voor agentruntime](/nl/agent-runtime-architecture)
