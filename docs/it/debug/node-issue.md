---
read_when:
    - Debug degli script di sviluppo solo Node o degli errori della modalità watch
    - Analisi degli arresti anomali del loader tsx/esbuild in OpenClaw
summary: Note e soluzioni alternative per il crash di Node + tsx "__name is not a function"
title: Arresto anomalo di Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Arresto anomalo di Node + tsx con "\_\_name is not a function"

## Riepilogo

L'esecuzione di OpenClaw tramite Node con `tsx` non riesce all'avvio con:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Il problema è iniziato dopo il passaggio degli script di sviluppo da Bun a `tsx` (commit `2871657e`, 2026-01-06). Lo stesso percorso di runtime funzionava con Bun.

## Ambiente

- Node: v25.x (osservato su v25.3.0)
- tsx: 4.21.0
- OS: macOS (riproduzione probabilmente possibile anche su altre piattaforme che eseguono Node 25)

## Riproduzione (solo Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Riproduzione minima nel repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Verifica della versione di Node

- Node 25.3.0: fallisce
- Node 22.22.0 (Homebrew `node@22`): fallisce
- Node 24: non ancora installato qui; richiede verifica

## Note / ipotesi

- `tsx` usa esbuild per trasformare TS/ESM. Il `keepNames` di esbuild emette un helper `__name` e avvolge le definizioni di funzione con `__name(...)`.
- L'arresto anomalo indica che `__name` esiste ma non è una funzione a runtime, il che implica che l'helper sia mancante o sovrascritto per questo modulo nel percorso del loader di Node 25.
- Problemi simili dell'helper `__name` sono stati segnalati in altri consumer di esbuild quando l'helper è mancante o riscritto.

## Cronologia della regressione

- `2871657e` (2026-01-06): gli script sono passati da Bun a tsx per rendere Bun opzionale.
- Prima di allora (percorso Bun), `openclaw status` e `gateway:watch` funzionavano.

## Soluzioni alternative

- Usare Bun per gli script di sviluppo (ripristino temporaneo attuale).
- Usare `tsgo` per il controllo dei tipi del repo, poi eseguire l'output compilato:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota storica: `tsc` è stato usato qui durante il debug di questo problema Node/tsx, ma le lane di controllo dei tipi del repo ora usano `tsgo`.
- Disabilitare esbuild keepNames nel loader TS, se possibile (impedisce l'inserimento dell'helper `__name`); attualmente tsx non lo espone.
- Testare Node LTS (22/24) con `tsx` per vedere se il problema è specifico di Node 25.

## Riferimenti

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Passaggi successivi

- Riprodurre su Node 22/24 per confermare la regressione di Node 25.
- Testare `tsx` nightly o fissarlo a una versione precedente se esiste una regressione nota.
- Se si riproduce su Node LTS, aprire una riproduzione minima upstream con lo stack trace di `__name`.

## Correlati

- [Installazione di Node.js](/it/install/node)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
