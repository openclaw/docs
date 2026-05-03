---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio del Plugin, di doctor o di installazione del gestore pacchetti
    - Stai mantenendo installazioni OpenClaw pacchettizzate o manifest dei Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-03T21:38:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Risoluzione delle dipendenze dei Plugin

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento a runtime
non esegue package manager, non ripara alberi di dipendenze e non modifica la directory del package
di OpenClaw.

## Suddivisione delle responsabilità

I package dei plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze runtime vivono in `dependencies` o
  `optionalDependencies` del package del plugin
- gli import SDK/core sono peer import o import forniti da OpenClaw
- i plugin di sviluppo locali portano le proprie dipendenze già installate
- i plugin npm e git sono installati in radici di package di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- rilevare la sorgente del plugin
- installare o aggiornare il package quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Radici di installazione

OpenClaw usa radici stabili per sorgente:

- i package npm vengono installati sotto `~/.openclaw/npm`
- i package git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/da percorso/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella radice npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm può effettuare l'hoisting delle dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al package del plugin. OpenClaw analizza la radice npm gestita prima di fidarsi
dell'installazione e usa npm per rimuovere i package gestiti da npm durante la disinstallazione, quindi le dipendenze
runtime con hoisting restano dentro il perimetro di pulizia gestito.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene poi caricato da quella directory del package, quindi la risoluzione
di `node_modules` locale al package e del genitore funziona nello stesso modo in cui funziona per un normale
package Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` o riparazioni delle dipendenze per loro. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso Jiti di emergenza. I plugin
JavaScript confezionati e i plugin interni in bundle vengono caricati tramite
import/require nativi invece che tramite Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se una dipendenza manca a runtime, il plugin non viene caricato e l'errore
dovrebbe indirizzare l'operatore a una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e installare
i plugin scaricabili configurati che mancano dai record di installazione locali.
Non ripara le dipendenze per un plugin locale già installato.

## Plugin in bundle

I plugin in bundle leggeri e critici per il core sono distribuiti come parte di OpenClaw.
Dovrebbero non avere un albero pesante di dipendenze runtime oppure essere spostati in un
package scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei plugin distribuiti nel package core, installati
esternamente o mantenuti solo come sorgente, consulta [Inventario dei Plugin](/it/plugins/plugin-inventory).

I manifest dei plugin in bundle non devono richiedere lo staging delle dipendenze. Le funzionalità
grandi o opzionali dei plugin dovrebbero essere confezionate come un normale plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin in bundle vengono caricati da `extensions/<id>`, quindi le dipendenze
workspace locali al package sono disponibili e le modifiche vengono acquisite direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` nella radice del repository
non è un modo supportato per preparare le dipendenze dei plugin in bundle.

| Forma di installazione           | Posizione del plugin in bundle        | Proprietario delle dipendenze                                          |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il package | Package OpenClaw e flussi espliciti di install/update/doctor dei plugin |
| Checkout Git più `pnpm install`  | Package workspace `extensions/<id>`   | Il workspace pnpm, incluse le dipendenze proprie di ogni package plugin |
| `openclaw plugins install ...`   | Radice plugin npm/git/ClawHub gestita | Il flusso di installazione/aggiornamento del plugin                    |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano radici di dipendenze per plugin in bundle all'avvio o
durante la riparazione con doctor. La pulizia doctor corrente rimuove quelle directory e quei
symlink obsoleti quando si usa `--fix`, incluse le vecchie radici `plugin-runtime-deps`, i symlink
di package con prefisso globale Node che puntano a target `plugin-runtime-deps` eliminati,
i manifest `.openclaw-runtime-deps*`, i `node_modules` dei plugin generati, le directory
di staging dell'installazione e gli store pnpm locali al package. Anche il postinstall del package
rimuove quei symlink globali prima di eliminare le radici target legacy, così gli aggiornamenti
non lasciano import di package ESM pendenti.

Questi percorsi sono solo residui legacy. Le nuove installazioni non dovrebbero crearli.
