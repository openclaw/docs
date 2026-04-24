---
read_when:
    - Lavorare sul codice o sui test di integrazione di Pi
    - Eseguire flussi di lint, typecheck e test live specifici di Pi
summary: 'Flusso di lavoro per sviluppatori per l''integrazione di Pi: build, test e validazione live'
title: Flusso di lavoro di sviluppo di Pi
x-i18n:
    generated_at: "2026-04-24T08:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Questa guida riassume un flusso di lavoro sensato per lavorare sull'integrazione Pi in OpenClaw.

## Type Checking e Linting

- Gate locale predefinito: `pnpm check`
- Gate di build: `pnpm build` quando la modifica può influire sull'output di build, sul packaging o sui confini di lazy-loading/modulo
- Gate completo prima del merge per modifiche rilevanti su Pi: `pnpm check && pnpm test`

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

Questo copre le principali suite di unit test di Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Test manuali

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
- `agents/<agentId>/agent/auth-profiles.json` per i profili auth del modello (chiavi API + OAuth)
- `credentials/` per lo stato provider/canale che vive ancora fuori dallo store dei profili auth
- `agents/<agentId>/sessions/` per la cronologia delle sessioni dell'agente
- `agents/<agentId>/sessions/sessions.json` per l'indice delle sessioni
- `sessions/` se esistono percorsi legacy
- `workspace/` se vuoi uno spazio di lavoro vuoto

Se vuoi reimpostare solo le sessioni, elimina `agents/<agentId>/sessions/` per quell'agente. Se vuoi mantenere l'auth, lascia intatti `agents/<agentId>/agent/auth-profiles.json` e qualsiasi stato provider sotto `credentials/`.

## Riferimenti

- [Testing](/it/help/testing)
- [Per iniziare](/it/start/getting-started)

## Correlati

- [Architettura di integrazione Pi](/it/pi)
