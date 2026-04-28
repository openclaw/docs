---
read_when:
    - Vuoi il loop di sviluppo locale più veloce (bun + watch)
    - Hai riscontrato problemi con installazione/patch/script del ciclo di vita di Bun
summary: 'Flusso di lavoro Bun (sperimentale): installazione e accorgimenti rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **non è consigliato per il runtime del Gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale facoltativo per eseguire TypeScript direttamente (`bun run ...`, `bun --watch ...`). Il package manager predefinito resta `pnpm`, che è pienamente supportato e usato dalla documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da git, quindi non c'è rumore nel repository. Per saltare completamente la scrittura del lockfile:

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

Bun blocca gli script del ciclo di vita delle dipendenze a meno che non siano esplicitamente attendibili. Per questo repository, gli script comunemente bloccati non sono necessari:

- `@whiskeysockets/baileys` `preinstall` -- controlla che la major di Node sia >= 20 (OpenClaw usa per impostazione predefinita Node 24 e continua a supportare Node 22 LTS, attualmente `22.14+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se incontri un problema runtime che richiede questi script, rendili esplicitamente attendibili:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Avvertenze

Alcuni script usano ancora in modo hardcoded pnpm (ad esempio `docs:build`, `ui:*`, `protocol:check`). Per ora esegui quelli tramite pnpm.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
