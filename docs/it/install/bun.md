---
read_when:
    - Vuoi il ciclo di sviluppo locale più rapido (bun + watch)
    - Hai riscontrato problemi con gli script di installazione/patch/ciclo di vita di Bun
summary: 'Flusso di lavoro Bun (sperimentale): installazioni e aspetti da considerare rispetto a pnpm'
title: Bun (sperimentale)
x-i18n:
    generated_at: "2026-06-27T17:39:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun è **sconsigliato per il runtime del Gateway** (problemi noti con WhatsApp e Telegram). Usa Node in produzione.
</Warning>

Bun è un runtime locale opzionale per eseguire TypeScript direttamente (`bun run ...`, `bun --watch ...`). Il package manager predefinito rimane `pnpm`, che è pienamente supportato e usato dagli strumenti della documentazione. Bun non può usare `pnpm-lock.yaml` e lo ignorerà.

## Installazione

<Steps>
  <Step title="Installa le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da git, quindi non generano variazioni nel repo. Per evitare del tutto la scrittura del lockfile:

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

Bun blocca gli script del ciclo di vita delle dipendenze a meno che non siano esplicitamente considerati attendibili. Per questo repo, gli script comunemente bloccati non sono necessari:

- `baileys` `preinstall` -- controlla che la versione major di Node sia >= 20 (OpenClaw usa per impostazione predefinita Node 24 e supporta ancora Node 22 LTS, attualmente `22.19+`)
- `protobufjs` `postinstall` -- emette avvisi su schemi di versione incompatibili (nessun artefatto di build)

Se riscontri un problema di runtime che richiede questi script, considerali attendibili esplicitamente:

```sh
bun pm trust baileys protobufjs
```

## Avvertenze

Alcuni script codificano ancora `pnpm` in modo rigido (per esempio `check:docs`, `ui:*`, `protocol:check`). Per ora eseguili tramite pnpm.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
