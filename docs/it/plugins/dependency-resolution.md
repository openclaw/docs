---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, del comando doctor o di installazione tramite gestore di pacchetti
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest di Plugin inclusi
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-06T09:01:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Risoluzione delle dipendenze dei Plugin

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento runtime
non esegue package manager, non ripara alberi di dipendenze e non modifica la directory del pacchetto
OpenClaw.

## Ripartizione delle responsabilità

I pacchetti Plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze runtime risiedono in `dependencies` o
  `optionalDependencies` del pacchetto plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locale portano le proprie dipendenze già installate
- i plugin npm e git vengono installati in radici di pacchetto possedute da OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- scoprire la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore azionabile quando mancano dipendenze

## Radici di installazione

OpenClaw usa radici stabili per sorgente:

- i pacchetti npm si installano sotto `~/.openclaw/npm`
- i pacchetti git si clonano sotto `~/.openclaw/git`
- le installazioni locali/da percorso/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella radice npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa radice npm gestita
per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball, lo aggiunge
alla radice gestita come dipendenza `file:` copiata, esegue la normale installazione npm,
quindi verifica i metadati del lockfile installato prima di fidarsi del plugin.
Questo è pensato per prove di accettazione del pacchetto e di release candidate in cui un
artefatto pack locale deve comportarsi come l'artefatto del registro che simula.

npm può hoistare le dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al pacchetto plugin. OpenClaw analizza la radice npm gestita prima di fidarsi
dell'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
runtime hoistate rimangono dentro il perimetro di pulizia gestito.

I plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza
peer. OpenClaw non consente a npm di installare una copia separata del pacchetto host
dal registro nella radice gestita, perché pacchetti host obsoleti possono influire sulla
risoluzione peer di npm durante installazioni successive di plugin. Invece, dopo che npm termina
di modificare la radice condivisa durante installazione, aggiornamento o disinstallazione, OpenClaw riafferma
i link `node_modules/openclaw` locali al plugin per i pacchetti installati che dichiarano
il peer host.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene poi caricato da quella directory di pacchetto, quindi la risoluzione
di `node_modules` locali al pacchetto e parent funziona nello stesso modo in cui funziona per un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dagli sviluppatori. OpenClaw non
esegue `npm install`, `pnpm install` né riparazioni delle dipendenze per essi. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso Jiti di emergenza. I plugin
JavaScript pacchettizzati e i plugin interni in bundle vengono caricati tramite
import/require nativi invece che tramite Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione del plugin, calcolano l'entrypoint e lo caricano.

Se manca una dipendenza a runtime, il plugin non viene caricato e l'errore
deve indicare all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e recuperare
plugin scaricabili mancanti dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze per un plugin locale già installato.

## Plugin in bundle

I plugin in bundle leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Devono non avere un albero pesante di dipendenze runtime oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, consulta [Inventario Plugin](/it/plugins/plugin-inventory).

I manifest dei plugin in bundle non devono richiedere lo staging delle dipendenze. Le funzionalità
plugin grandi o opzionali devono essere pacchettizzate come un normale plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin in bundle vengono caricati da `extensions/<id>` così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono raccolte direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` alla radice del repository
non è un modo supportato per preparare le dipendenze dei plugin in bundle.

| Forma di installazione           | Posizione del plugin in bundle        | Proprietario delle dipendenze                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di install/update/doctor dei plugin |
| Checkout git più `pnpm install` | Pacchetti workspace `extensions/<id>`  | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto plugin |
| `openclaw plugins install ...`   | Radice plugin gestita npm/git/ClawHub | Il flusso di install/update del plugin                               |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano radici di dipendenze per plugin in bundle all'avvio o
durante la riparazione doctor. La pulizia doctor corrente rimuove quelle directory obsolete e
i symlink quando viene usato `--fix`, inclusi le vecchie radici `plugin-runtime-deps`, i symlink
di pacchetti con prefisso globale Node che puntano a destinazioni `plugin-runtime-deps` potate,
i manifest `.openclaw-runtime-deps*`, i `node_modules` dei plugin generati, le directory
di staging dell'installazione e gli store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quei symlink globali prima di potare le radici di destinazione legacy, così gli aggiornamenti
non lasciano import di pacchetti ESM pendenti.

Questi percorsi sono solo residui legacy. Le nuove installazioni non devono crearli.
