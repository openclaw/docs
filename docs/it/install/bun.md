---
read_when:
    - Vuoi il ciclo di sviluppo locale più rapido (bun + watch)
    - Si sono verificati problemi con gli script di installazione, patch o ciclo di vita di Bun
summary: 'Flusso di lavoro con Bun (sperimentale): installazione e aspetti critici rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
    generated_at: "2026-07-12T07:09:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun non è consigliato come runtime del Gateway (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale opzionale per eseguire direttamente TypeScript (`bun run ...`, `bun --watch ...`). Il gestore di pacchetti predefinito rimane `pnpm`, che è pienamente supportato e utilizzato dagli strumenti per la documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignora.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da Git, quindi non vengono introdotte modifiche nel repository. Per evitare completamente la scrittura dei file di lock:

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

Bun blocca gli script del ciclo di vita delle dipendenze, a meno che non siano esplicitamente considerati attendibili. Per questo repository, gli script comunemente bloccati non sono necessari:

- `baileys` `preinstall`: verifica che la versione principale di Node sia >= 20 (OpenClaw richiede Node 22.19+ o 23.11+, mentre Node 24 è consigliato)
- `protobufjs` `postinstall`: genera avvisi relativi a schemi di versione incompatibili (nessun artefatto di compilazione)

Se riscontri un problema di runtime che richiede questi script, considerali esplicitamente attendibili:

```sh
bun pm trust baileys protobufjs
```

## Limitazioni

Alcuni script dei pacchetti includono internamente `pnpm` in modo esplicito (ad esempio `check:docs`, `ui:*`, `protocol:check`). Eseguendoli tramite `bun run`, viene comunque invocato `pnpm` nella shell, quindi eseguili direttamente tramite `pnpm`.

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
