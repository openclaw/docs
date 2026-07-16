---
read_when:
    - Werken aan runtimecode of tests voor OpenClaw-agenten
    - Lint-, typecheck- en livetestflows voor de agent-runtime uitvoeren
summary: 'Workflow voor ontwikkelaars van de OpenClaw-agentruntime: bouwen, testen en live valideren'
title: OpenClaw-agentruntimeworkflow
x-i18n:
    generated_at: "2026-07-16T15:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Ontwikkelaarsworkflow voor de agentruntime (`src/agents/`) in de OpenClaw-repository.

## Typecontrole en linting

- Standaard lokale controle: `pnpm check` (typecontrole, linting, beleidscontroles)
- Buildcontrole: `pnpm build` wanneer de wijziging invloed kan hebben op builduitvoer, packaging of grenzen voor lazy loading/modules
- Volledige controle vóór pushen: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Agentruntimetests uitvoeren

Voer de unit-testsuites voor de agentruntime uit:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Het eerste globpatroon omvat ook de suites `agent-tools*`, `agent-settings` en
`agent-tool-definition-adapter*`.

Live tests zijn uitgesloten van de unitconfiguratie; voer ze uit via de live
wrapper (stelt `OPENCLAW_LIVE_TEST=1` in en vereist providerreferenties):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Handmatig testen

- Voer de Gateway uit in ontwikkelmodus (slaat kanaalverbindingen over via `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Activeer één agentbeurt via de Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Gebruik de TUI voor interactief debuggen: `pnpm tui`

Vraag voor het gedrag van toolaanroepen om een actie met `read` of `exec`, zodat je
toolstreaming en payloadverwerking kunt volgen.

## Volledige reset

De status bevindt zich in de OpenClaw-statusmap: standaard `~/.openclaw`, of
`$OPENCLAW_STATE_DIR` wanneer deze is ingesteld. Paden relatief ten opzichte van die map:

| Pad                                            | Bevat                                                                         |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `openclaw.json`                             | Configuratie                                                                  |
| `state/openclaw.sqlite`                             | Gedeelde database met runtimestatus                                           |
| `agents/<agentId>/agent/openclaw-agent.sqlite`                             | Modelauthenticatieprofielen per agent (API-sleutels + OAuth) en runtimestatus |
| `credentials/`                             | Provider-/kanaalreferenties buiten de opslag voor authenticatieprofielen      |
| `agents/<agentId>/sessions/`                             | Transcriptgeschiedenis en bronnen voor migratie van verouderde sessies        |
| `sessions/`                             | Verouderde sessieopslag voor één agent (alleen oude installaties)             |
| `workspace/`                             | Standaardwerkruimte voor agents (extra agents gebruiken `workspace-<agentId>`)   |

Verwijder deze paden voor een volledige reset. Beperktere resets:

- Alleen sessies: verwijder `agents/<agentId>/agent/openclaw-agent.sqlite` niet; sessierijen staan daar naast andere status per agent. Gebruik `/new` of `/reset` om voor één chat een nieuwe sessie te starten en `openclaw sessions cleanup` voor sessieonderhoud.
- Authenticatie behouden: laat `agents/<agentId>/agent/openclaw-agent.sqlite` en `credentials/` staan.

Verouderde `auth-profiles.json`-bestanden worden tijdens runtime niet meer gelezen;
`openclaw doctor --fix` importeert ze in de SQLite-opslag.

## Referenties

- [Testen](/nl/help/testing)
- [Aan de slag](/nl/start/getting-started)

## Gerelateerd

- [Architectuur van de OpenClaw-agentruntime](/nl/agent-runtime-architecture)
