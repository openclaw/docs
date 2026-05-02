---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei plugin, di doctor o di installazione tramite gestore di pacchetti
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest dei Plugin inclusi nel bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-02T08:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Risoluzione delle dipendenze dei Plugin

OpenClaw mantiene il lavoro sulle dipendenze dei Plugin al momento dell'installazione/aggiornamento. Il caricamento di runtime
non esegue gestori di pacchetti, non ripara alberi di dipendenze né modifica la directory dei pacchetti
di OpenClaw.

## Ripartizione delle responsabilità

I pacchetti Plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze di runtime risiedono in `dependencies` o
  `optionalDependencies` del pacchetto Plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i Plugin di sviluppo locale portano le proprie dipendenze già installate
- i Plugin npm e git sono installati in root di pacchetti di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del Plugin:

- scoprire l'origine del Plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare il punto di ingresso del Plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per ogni origine:

- i pacchetti npm si installano sotto `~/.openclaw/npm`
- i pacchetti git si clonano sotto `~/.openclaw/git`
- le installazioni locali/percorso/archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella root npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm può innalzare le dipendenze transitive a `~/.openclaw/npm/node_modules` accanto
al pacchetto Plugin. OpenClaw analizza la root npm gestita prima di considerare attendibile
l'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
di runtime innalzate restano dentro il perimetro di pulizia gestita.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il Plugin installato viene poi caricato da quella directory del pacchetto, quindi la risoluzione
di `node_modules` locale al pacchetto e padre funziona nello stesso modo di un normale
pacchetto Node.

## Plugin locali

I Plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` né riparazioni delle dipendenze per essi. Se un
Plugin locale ha dipendenze, installale in quel Plugin prima di caricarlo.

I Plugin locali TypeScript di terze parti possono usare il percorso di emergenza Jiti. I Plugin
JavaScript pacchettizzati e i Plugin interni inclusi vengono caricati tramite
import/require nativi invece che tramite Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei Plugin. Leggono
i record di installazione dei Plugin, calcolano il punto di ingresso e lo caricano.

Se una dipendenza manca a runtime, il Plugin non viene caricato e l'errore
deve indicare all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e installare
i Plugin scaricabili configurati che mancano dai record di installazione locali.
Non ripara le dipendenze di un Plugin locale già installato.

## Plugin inclusi

I Plugin inclusi leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Dovrebbero non avere un albero di dipendenze di runtime pesante oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

I manifest dei Plugin inclusi non devono richiedere lo staging delle dipendenze. Le funzionalità di Plugin
ampie o opzionali devono essere pacchettizzate come un normale Plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei Plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come monorepo pnpm. Dopo
`pnpm install`, i Plugin inclusi vengono caricati da `extensions/<id>` in modo che le dipendenze
workspace locali al pacchetto siano disponibili e le modifiche vengano rilevate direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` alla root del repository non è
un modo supportato per preparare le dipendenze dei Plugin inclusi.

| Forma di installazione           | Posizione del Plugin incluso          | Proprietario delle dipendenze                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero di runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei Plugin |
| Checkout git più `pnpm install` | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto Plugin |
| `openclaw plugins install ...`   | Root Plugin npm/git/ClawHub gestita   | Il flusso di installazione/aggiornamento del Plugin                  |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano root di dipendenze dei Plugin inclusi all'avvio o
durante la riparazione doctor. La pulizia doctor attuale rimuove quelle directory e
quei symlink obsoleti quando si usa `--fix`, incluse le vecchie root `plugin-runtime-deps`,
i manifest `.openclaw-runtime-deps*`, i `node_modules` dei Plugin generati, le directory
di staging dell'installazione e gli store pnpm locali al pacchetto.

Questi percorsi sono solo residui legacy. Le nuove installazioni non devono crearli.
