---
read_when:
    - Vuoi il ciclo di sviluppo locale più veloce (bun + watch)
    - Hai riscontrato problemi con gli script di installazione/patch/ciclo di vita di Bun
summary: 'Flusso di lavoro Bun (sperimentale): installazioni e insidie rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
    generated_at: "2026-04-30T08:57:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **non è consigliato per il runtime del Gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale facoltativo per eseguire direttamente TypeScript (`bun run ...`, `bun --watch ...`). Il gestore di pacchetti predefinito rimane `pnpm`, che è pienamente supportato e usato dagli strumenti della documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da git, quindi non c'è churn nel repo. Per saltare completamente la scrittura del lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compila ed esegui i test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script del ciclo di vita

Bun blocca gli script del ciclo di vita delle dipendenze a meno che non siano considerati esplicitamente attendibili. Per questo repo, gli script comunemente bloccati non sono necessari:

- `@whiskeysockets/baileys` `preinstall` -- verifica che la versione major di Node sia >= 20 (OpenClaw usa per impostazione predefinita Node 24 e supporta ancora Node 22 LTS, attualmente `22.14+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se riscontri un problema di runtime che richiede questi script, rendili esplicitamente attendibili:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Avvertenze

Alcuni script codificano ancora pnpm in modo fisso (per esempio `docs:build`, `ui:*`, `protocol:check`). Per ora eseguili tramite pnpm.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
