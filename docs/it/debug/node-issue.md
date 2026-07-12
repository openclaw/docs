---
read_when:
    - Analisi di un arresto anomalo del loader tsx/esbuild che segnala la mancanza dell'helper __name
summary: Arresto anomalo storico di Node + tsx con "__name is not a function" e relativa causa
title: Arresto anomalo di Node + tsx
x-i18n:
    generated_at: "2026-07-12T07:02:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Arresto anomalo di Node + tsx con "\_\_name is not a function"

## Stato

Risolto. Questo arresto anomalo non si riproduce con la versione corrente di `tsx` fissata in
`package.json` (`4.22.3`) né con le versioni correnti di Node. Questa pagina viene conservata nel caso in cui un
futuro aggiornamento di `tsx`/esbuild reintroduca il problema.

## Sintomo originale

L'esecuzione degli script di sviluppo di OpenClaw tramite `tsx` non riusciva all'avvio con:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

I numeri di riga sono omessi; entrambi i file sono cambiati dall'arresto anomalo originale
e le righe specifiche non corrispondono più.

Il problema è comparso dopo il passaggio degli script di sviluppo da Bun a `tsx` (`2871657e`,
2026-01-06), effettuato per rendere Bun facoltativo. Il percorso equivalente basato su Bun non
causava arresti anomali. Il problema è stato osservato inizialmente con Node v25.3.0 su macOS; si
riteneva probabile che fossero interessate anche altre piattaforme che eseguivano Node 25.

## Causa

`tsx` trasforma TS/ESM tramite esbuild con `keepNames: true` impostato direttamente
nelle relative opzioni di trasformazione. Questa impostazione fa sì che esbuild racchiuda le dichiarazioni
di funzioni/classi con nome in una chiamata a un helper `__name`, in modo che `fn.name` venga preservato
durante la minificazione e il bundling. L'arresto anomalo indica che l'helper era assente o sottoposto a
shadowing nel punto di chiamata di quel modulo nella combinazione di `tsx`/Node interessata, pertanto
`__name(...)` generava un'eccezione invece di restituire il valore racchiuso.

## Verifica di riproduzione attuale

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Riproduzione minima isolata (carica solo il modulo della traccia dello stack originale):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Attualmente entrambi i comandi terminano senza errori. Se uno dei due genera nuovamente
`__name is not a function`, acquisire la versione esatta di Node, la versione di `tsx`
(`node_modules/tsx/package.json`) e la traccia dello stack completa prima di segnalare il problema upstream.

## Soluzioni alternative (se l'arresto anomalo si ripresenta)

- Eseguire gli script di sviluppo con Bun anziché con `node --import tsx`.
- Eseguire `pnpm tsgo` per il controllo dei tipi, quindi eseguire l'output compilato anziché il
  codice sorgente tramite `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Provare una versione diversa di `tsx` (`pnpm add -D tsx@<version>` costituisce una modifica
  delle dipendenze e richiede l'approvazione secondo le regole del repository) per individuare se la versione
  di esbuild inclusa abbia reintrodotto il bug.
- Eseguire il test con una versione principale/secondaria diversa di Node per verificare se l'errore
  dipenda dalla versione.

## Riferimenti

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Contenuti correlati

- [Installazione di Node.js](/it/install/node)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
