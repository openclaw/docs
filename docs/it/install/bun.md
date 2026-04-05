---
read_when:
    - Vuoi il loop di sviluppo locale più veloce (bun + watch)
    - Hai riscontrato problemi con installazione/patch/script lifecycle di Bun
summary: 'Workflow Bun (sperimentale): installazioni e aspetti da considerare rispetto a pnpm'
title: Bun (Sperimentale)
x-i18n:
    generated_at: "2026-04-05T13:54:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (Sperimentale)

<Warning>
Bun **non è consigliato per il runtime del gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale facoltativo per eseguire direttamente TypeScript (`bun run ...`, `bun --watch ...`). Il gestore pacchetti predefinito resta `pnpm`, che è pienamente supportato e usato dalla tooling della documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da git, quindi non c'è churn nel repository. Per saltare completamente la scrittura del lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build e test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Script lifecycle

Bun blocca gli script lifecycle delle dipendenze a meno che non siano esplicitamente trusted. Per questo repository, gli script comunemente bloccati non sono necessari:

- `@whiskeysockets/baileys` `preinstall` -- controlla che la versione major di Node sia >= 20 (OpenClaw usa per impostazione predefinita Node 24 e continua a supportare Node 22 LTS, attualmente `22.14+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se riscontri un problema runtime che richiede questi script, considerali esplicitamente trusted:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Limitazioni

Alcuni script continuano a usare `pnpm` in modo hardcoded (ad esempio `docs:build`, `ui:*`, `protocol:check`). Per ora eseguili tramite pnpm.
