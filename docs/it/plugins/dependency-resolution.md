---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio del plugin, del doctor o dell'installazione del package manager
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest di Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Risoluzione delle dipendenze dei Plugin

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento di installazione/aggiornamento. Il caricamento a runtime
non esegue package manager, non ripara alberi di dipendenze e non modifica la directory del pacchetto
OpenClaw.

## Suddivisione delle responsabilità

I pacchetti plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze runtime vivono in `dependencies` o
  `optionalDependencies` del pacchetto plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locale portano le proprie dipendenze già installate
- i plugin npm e git sono installati in root di pacchetti di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- rilevare la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per sorgente:

- i pacchetti npm si installano sotto `~/.openclaw/npm`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/percorso/archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella root npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm può innalzare dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al pacchetto plugin. OpenClaw scandisce la root npm gestita prima di fidarsi
dell'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
runtime innalzate restano dentro il confine di pulizia gestito.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene poi caricato da quella directory del pacchetto, quindi la risoluzione
`node_modules` locale al pacchetto e del genitore funziona nello stesso modo di un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` né riparazione delle dipendenze per loro. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso di emergenza Jiti. I plugin
JavaScript pacchettizzati e i plugin interni inclusi vengono caricati tramite
import/require nativi invece che con Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se una dipendenza manca a runtime, il plugin non viene caricato e l'errore
deve indirizzare l'operatore a una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e recuperare
plugin scaricabili che mancano dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze di un plugin locale già installato.

## Plugin inclusi

I plugin inclusi leggeri e critici per il core sono distribuiti come parte di OpenClaw.
Non dovrebbero avere un albero pesante di dipendenze runtime oppure dovrebbero essere spostati
in un pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato attuale dei plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, vedi [Inventario dei Plugin](/it/plugins/plugin-inventory).

I manifest dei plugin inclusi non devono richiedere staging delle dipendenze. Funzionalità
grandi o opzionali dei plugin dovrebbero essere pacchettizzate come plugin normali e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come monorepo pnpm. Dopo
`pnpm install`, i plugin inclusi vengono caricati da `extensions/<id>` così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono acquisite direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; il semplice `npm install` nella root del repository non è
un modo supportato per preparare le dipendenze dei plugin inclusi.

| Forma di installazione           | Posizione del plugin incluso          | Proprietario delle dipendenze                                          |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di install/update/doctor dei plugin |
| Checkout Git più `pnpm install`  | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto plugin |
| `openclaw plugins install ...`   | Root plugin npm/git/ClawHub gestita   | Il flusso di installazione/aggiornamento del plugin                    |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano root di dipendenze dei plugin inclusi all'avvio o
durante la riparazione di doctor. La pulizia attuale di doctor rimuove quelle directory obsolete e
i symlink quando viene usato `--fix`, incluse vecchie root `plugin-runtime-deps`, symlink di pacchetti
globali con prefisso Node che puntano a target `plugin-runtime-deps` eliminati,
manifest `.openclaw-runtime-deps*`, `node_modules` dei plugin generati, directory di stage
di installazione e store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quei symlink globali prima di eliminare le root target legacy, così gli aggiornamenti
non lasciano import di pacchetti ESM pendenti.

Questi percorsi sono solo detriti legacy. Le nuove installazioni non dovrebbero crearli.
