---
read_when:
    - Lavorare sul codice o sui test del runtime degli agenti OpenClaw
    - Esecuzione dei flussi di lint, typecheck e test live di agent-runtime
summary: 'Flusso di lavoro per sviluppatori per il runtime degli agenti OpenClaw: build, test e validazione live'
title: Flusso di lavoro del runtime degli agenti OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Un flusso di lavoro ragionevole per lavorare sul runtime agente OpenClaw in OpenClaw.

## Controllo dei tipi e linting

- Gate locale predefinito: `pnpm check`
- Gate di build: `pnpm build` quando la modifica può influire sull'output di build, sul packaging o sui confini di lazy-loading/moduli
- Gate completo per il landing delle modifiche al runtime agente: `pnpm check && pnpm test`

## Esecuzione dei test del runtime agente

Esegui direttamente il set di test del runtime agente con Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Per includere l'esercizio del provider live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Questo copre le principali suite di unit test del runtime agente:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Test manuale

Flusso consigliato:

- Esegui il Gateway in modalità dev:
  - `pnpm gateway:dev`
- Attiva direttamente l'agente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Usa la TUI per il debugging interattivo:
  - `pnpm tui`

Per il comportamento delle chiamate agli strumenti, richiedi un'azione `read` o `exec` così puoi vedere lo streaming degli strumenti e la gestione dei payload.

## Ripristino da zero

Lo stato risiede nella directory di stato di OpenClaw. Il valore predefinito è `~/.openclaw`. Se `OPENCLAW_STATE_DIR` è impostata, usa invece quella directory.

Per ripristinare tutto:

- `openclaw.json` per la configurazione
- `agents/<agentId>/agent/auth-profiles.json` per i profili di autenticazione dei modelli (chiavi API + OAuth)
- `credentials/` per lo stato di provider/canale che risiede ancora al di fuori dell'archivio dei profili di autenticazione
- `agents/<agentId>/sessions/` per la cronologia delle sessioni agente
- `agents/<agentId>/sessions/sessions.json` per l'indice delle sessioni
- `sessions/` se esistono percorsi legacy
- `workspace/` se vuoi uno spazio di lavoro vuoto

Se vuoi reimpostare solo le sessioni, elimina `agents/<agentId>/sessions/` per quell'agente. Se vuoi mantenere l'autenticazione, lascia al loro posto `agents/<agentId>/agent/auth-profiles.json` e qualsiasi stato del provider sotto `credentials/`.

## Riferimenti

- [Test](/it/help/testing)
- [Introduzione](/it/start/getting-started)

## Correlati

- [Architettura del runtime agente OpenClaw](/it/agent-runtime-architecture)
