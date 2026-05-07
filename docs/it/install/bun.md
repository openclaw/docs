---
read_when:
    - Vuoi il ciclo di sviluppo locale più rapido (bun + watch)
    - Hai riscontrato problemi con gli script di installazione/patch/ciclo di vita di Bun
summary: 'Flusso di lavoro Bun (sperimentale): installazioni e insidie rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
    generated_at: "2026-05-07T13:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **non è consigliato per il runtime del gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale facoltativo per eseguire TypeScript direttamente (`bun run ...`, `bun --watch ...`). Il package manager predefinito resta `pnpm`, che è pienamente supportato e usato dagli strumenti della documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono esclusi da gitignore, quindi non c'è churn nel repo. Per evitare completamente la scrittura del lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compila e testa">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script del ciclo di vita

Bun blocca gli script del ciclo di vita delle dipendenze a meno che non siano considerati esplicitamente attendibili. Per questo repo, gli script comunemente bloccati non sono necessari:

- `@whiskeysockets/baileys` `preinstall` -- controlla che la versione principale di Node sia >= 20 (OpenClaw usa Node 24 per impostazione predefinita e supporta ancora Node 22 LTS, attualmente `22.16+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se riscontri un problema di runtime che richiede questi script, rendili esplicitamente attendibili:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Avvertenze

Alcuni script hanno ancora pnpm codificato direttamente (ad esempio `docs:build`, `ui:*`, `protocol:check`). Per ora eseguili tramite pnpm.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
