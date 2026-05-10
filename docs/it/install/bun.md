---
read_when:
    - Vuoi il ciclo di sviluppo locale più rapido (bun + watch)
    - Hai riscontrato problemi con l’installazione, le patch o gli script del ciclo di vita di Bun
summary: 'Flusso di lavoro Bun (sperimentale): installazioni e avvertenze rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
    generated_at: "2026-05-10T19:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun è **sconsigliato per il runtime del Gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale opzionale per eseguire TypeScript direttamente (`bun run ...`, `bun --watch ...`). Il package manager predefinito rimane `pnpm`, che è pienamente supportato e usato dagli strumenti della documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da git, quindi non generano modifiche nel repo. Per evitare del tutto la scrittura del lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script del ciclo di vita

Bun blocca gli script del ciclo di vita delle dipendenze, a meno che non siano considerati esplicitamente attendibili. Per questo repo, gli script comunemente bloccati non sono necessari:

- `baileys` `preinstall` -- verifica che la versione principale di Node sia >= 20 (OpenClaw usa per impostazione predefinita Node 24 e supporta ancora Node 22 LTS, attualmente `22.16+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se riscontri un problema di runtime che richiede questi script, rendili esplicitamente attendibili:

```sh
bun pm trust baileys protobufjs
```

## Avvertenze

Alcuni script hanno ancora pnpm hardcoded (per esempio `docs:build`, `ui:*`, `protocol:check`). Per ora eseguili tramite pnpm.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
