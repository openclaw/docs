---
read_when:
    - Stai lavorando su codice o test di integrazione Pi
    - Stai eseguendo flussi Pi-specifici di lint, typecheck e test live
summary: 'Flusso di lavoro per sviluppatori per l''integrazione Pi: build, test e validazione live'
title: Flusso di sviluppo Pi
x-i18n:
    generated_at: "2026-04-05T13:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Flusso di sviluppo Pi

Questa guida riassume un flusso di lavoro ragionevole per lavorare sull'integrazione pi in OpenClaw.

## Type checking e linting

- Gate locale predefinito: `pnpm check`
- Gate di build: `pnpm build` quando la modifica può influire sull'output di build, sul packaging o sui confini di lazy-loading/modulo
- Gate completo di landing per modifiche pesanti su Pi: `pnpm check && pnpm test`

## Esecuzione dei test Pi

Esegui direttamente con Vitest il set di test focalizzato su Pi:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Per includere l'esercizio live del provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Questo copre le principali suite unitarie Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Test manuale

Flusso consigliato:

- Esegui il gateway in modalità dev:
  - `pnpm gateway:dev`
- Attiva direttamente l'agente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI per il debug interattivo:
  - `pnpm tui`

Per il comportamento delle chiamate agli strumenti, chiedi un'azione `read` o `exec` così puoi vedere lo streaming degli strumenti e la gestione del payload.

## Reset pulito

Lo stato si trova sotto la directory di stato di OpenClaw. Il valore predefinito è `~/.openclaw`. Se `OPENCLAW_STATE_DIR` è impostato, usa invece quella directory.

Per reimpostare tutto:

- `openclaw.json` per la configurazione
- `agents/<agentId>/agent/auth-profiles.json` per i profili di autenticazione del modello (chiavi API + OAuth)
- `credentials/` per lo stato del provider/canale che vive ancora fuori dall'archivio dei profili di autenticazione
- `agents/<agentId>/sessions/` per la cronologia delle sessioni dell'agente
- `agents/<agentId>/sessions/sessions.json` per l'indice delle sessioni
- `sessions/` se esistono percorsi legacy
- `workspace/` se vuoi un workspace vuoto

Se vuoi reimpostare solo le sessioni, elimina `agents/<agentId>/sessions/` per quell'agente. Se vuoi mantenere l'autenticazione, lascia al loro posto `agents/<agentId>/agent/auth-profiles.json` e qualsiasi stato provider sotto `credentials/`.

## Riferimenti

- [Testing](/help/testing)
- [Getting Started](/start/getting-started)
