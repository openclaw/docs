---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, di doctor o di installazione del gestore di pacchetti
    - Stai gestendo installazioni OpenClaw pacchettizzate o manifest dei Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-02T20:48:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Risoluzione delle dipendenze dei Plugin

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento runtime
non esegue gestori di pacchetti, non ripara alberi di dipendenze né modifica la directory del pacchetto
OpenClaw.

## Divisione delle responsabilità

I pacchetti plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze runtime risiedono in `dependencies` o
  `optionalDependencies` del pacchetto plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locale portano le proprie dipendenze già installate
- i plugin npm e git vengono installati in radici di pacchetto di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- rilevare la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Radici di installazione

OpenClaw usa radici stabili per sorgente:

- i pacchetti npm si installano sotto `~/.openclaw/npm`
- i pacchetti git si clonano sotto `~/.openclaw/git`
- le installazioni locali/da percorso/archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella radice npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm può eseguire l'hoist delle dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al pacchetto plugin. OpenClaw esamina la radice npm gestita prima di considerare attendibile
l'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
runtime sottoposte a hoist restano all'interno del perimetro di pulizia gestito.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene quindi caricato da quella directory del pacchetto, quindi la risoluzione
di `node_modules` locale al pacchetto e padre funziona nello stesso modo di un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` né riparazioni delle dipendenze per loro. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin TypeScript locali di terze parti possono usare il percorso di emergenza Jiti. I plugin
JavaScript pacchettizzati e i plugin interni in bundle vengono caricati tramite
import/require nativo invece di Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai le dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se una dipendenza manca a runtime, il caricamento del plugin fallisce e l'errore
dovrebbe indicare all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato delle dipendenze legacy generato da OpenClaw e installare
i plugin scaricabili configurati che mancano dai record di installazione locali.
Non ripara le dipendenze di un plugin locale già installato.

## Plugin in bundle

I plugin in bundle leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Dovrebbero non avere alberi pesanti di dipendenze runtime oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, consulta [Inventario Plugin](/it/plugins/plugin-inventory).

I manifest dei plugin in bundle non devono richiedere staging delle dipendenze. Le funzionalità
plugin grandi o opzionali dovrebbero essere pacchettizzate come un normale plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin in bundle si caricano da `extensions/<id>`, quindi le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono recepite direttamente. Lo sviluppo da
checkout sorgente è solo pnpm; un semplice `npm install` alla radice del repository non è
un modo supportato per preparare le dipendenze dei plugin in bundle.

| Forma di installazione           | Posizione del plugin in bundle        | Proprietario delle dipendenze                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei plugin |
| Checkout Git più `pnpm install` | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ciascun pacchetto plugin |
| `openclaw plugins install ...`   | Radice plugin npm/git/ClawHub gestita | Il flusso di installazione/aggiornamento del plugin                  |

## Pulizia legacy

Le versioni più vecchie di OpenClaw generavano radici di dipendenze per plugin in bundle all'avvio o
durante la riparazione doctor. L'attuale pulizia doctor rimuove quelle directory e
quei symlink obsoleti quando si usa `--fix`, incluse le vecchie radici `plugin-runtime-deps`,
i manifest `.openclaw-runtime-deps*`, i `node_modules` generati dei plugin, le directory
di staging dell'installazione e gli store pnpm locali al pacchetto.

Questi percorsi sono solo residui legacy. Le nuove installazioni non dovrebbero crearli.
