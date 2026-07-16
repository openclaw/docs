---
read_when:
    - Si desidera installare le dipendenze o eseguire gli script dei pacchetti con Bun
    - Si verificano problemi con gli script di installazione, patch o ciclo di vita di Bun
summary: Flusso di lavoro Bun per le installazioni e gli script dei pacchetti; Node è richiesto in fase di esecuzione
title: Bun
x-i18n:
    generated_at: "2026-07-16T14:31:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun non può eseguire la CLI o il Gateway di OpenClaw perché non fornisce l'API `node:sqlite` richiesta. Installare una versione di Node supportata per tutti i comandi di runtime di OpenClaw.
</Warning>

Bun rimane utilizzabile come programma facoltativo per l'installazione delle dipendenze e l'esecuzione degli script dei pacchetti. Il gestore di pacchetti predefinito rimane `pnpm`, che è pienamente supportato e utilizzato dagli strumenti per la documentazione. Bun non può utilizzare `pnpm-lock.yaml` e lo ignora.

## Installazione

<Steps>
  <Step title="Installare le dipendenze">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sono ignorati da Git, quindi non vengono generate modifiche nel repository. Per evitare completamente la scrittura dei file di lock:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compilare ed eseguire i test">
    ```sh
    bun run build
    bun run vitest run
    ```

    I comandi che avviano OpenClaw devono comunque essere eseguiti tramite Node.

  </Step>
</Steps>

## Script del ciclo di vita

Bun blocca gli script del ciclo di vita delle dipendenze, a meno che non siano esplicitamente considerati attendibili. Per questo repository, gli script comunemente bloccati non sono necessari:

- `baileys` `preinstall`: verifica che la versione principale di Node sia >= 20 (OpenClaw richiede Node 22.22.3+, 24.15+ o 25.9+, con Node 24 consigliato)
- `protobufjs` `postinstall`: genera avvisi relativi a schemi di versione incompatibili (nessun artefatto di compilazione)

Se si verifica un problema di runtime che richiede questi script, considerarli esplicitamente attendibili:

```sh
bun pm trust baileys protobufjs
```

## Avvertenze

Alcuni script dei pacchetti contengono internamente `pnpm` in modo esplicito (ad esempio `check:docs`, `ui:*`, `protocol:check`). La loro esecuzione tramite `bun run` richiama comunque `pnpm` nella shell, quindi è sufficiente eseguirli direttamente tramite `pnpm`.

## Argomenti correlati

- [Panoramica dell'installazione](/it/install)
- [Node.js](/it/install/node)
- [Aggiornamento](/it/install/updating)
