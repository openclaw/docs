---
read_when:
    - Eseguire il debug di script di sviluppo solo Node o di errori in modalità watch
    - Indagare i crash del loader tsx/esbuild in OpenClaw
summary: Note e soluzioni alternative per il crash Node + tsx "__name is not a function"
title: Crash Node + tsx
x-i18n:
    generated_at: "2026-04-24T08:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Crash Node + tsx "\_\_name is not a function"

## Riepilogo

L’esecuzione di OpenClaw tramite Node con `tsx` fallisce all’avvio con:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Questo problema è iniziato dopo il passaggio degli script di sviluppo da Bun a `tsx` (commit `2871657e`, 2026-01-06). Lo stesso percorso di runtime funzionava con Bun.

## Ambiente

- Node: v25.x (osservato su v25.3.0)
- tsx: 4.21.0
- OS: macOS (la riproduzione è probabilmente possibile anche su altre piattaforme che eseguono Node 25)

## Riproduzione (solo Node)

```bash
# nella radice del repository
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Riproduzione minima nel repository

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Controllo della versione di Node

- Node 25.3.0: fallisce
- Node 22.22.0 (Homebrew `node@22`): fallisce
- Node 24: non ancora installato qui; da verificare

## Note / ipotesi

- `tsx` usa esbuild per trasformare TS/ESM. `keepNames` di esbuild emette un helper `__name` e racchiude le definizioni di funzione con `__name(...)`.
- Il crash indica che `__name` esiste ma non è una funzione a runtime, il che implica che l’helper manchi o venga sovrascritto per questo modulo nel percorso del loader Node 25.
- Problemi simili con l’helper `__name` sono stati segnalati in altri consumer di esbuild quando l’helper manca o viene riscritto.

## Cronologia della regressione

- `2871657e` (2026-01-06): gli script sono passati da Bun a tsx per rendere Bun opzionale.
- Prima di questo cambiamento (percorso Bun), `openclaw status` e `gateway:watch` funzionavano.

## Soluzioni alternative

- Usa Bun per gli script di sviluppo (attuale revert temporaneo).
- Usa `tsgo` per il type checking del repository, poi esegui l’output compilato:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota storica: durante il debug di questo problema Node/tsx qui era stato usato `tsc`, ma ora le lane di type-check del repository usano `tsgo`.
- Disabilita `keepNames` di esbuild nel loader TS, se possibile (impedisce l’inserimento dell’helper `__name`); al momento tsx non espone questa opzione.
- Prova Node LTS (22/24) con `tsx` per vedere se il problema è specifico di Node 25.

## Riferimenti

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Prossimi passi

- Riprodurre su Node 22/24 per confermare una regressione di Node 25.
- Testare `tsx` nightly o fissare una versione precedente se esiste una regressione nota.
- Se si riproduce su Node LTS, aprire un repro minimo upstream con lo stack trace di `__name`.

## Correlati

- [Installazione di Node.js](/it/install/node)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
