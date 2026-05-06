---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei plugin, di doctor o di installazione del gestore di pacchetti
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest di Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti dei plugin e risolve le dipendenze dei plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento in fase di esecuzione
non esegue gestori di pacchetti, non ripara gli alberi delle dipendenze e non modifica la directory del pacchetto
OpenClaw.

## Suddivisione delle responsabilità

I pacchetti dei plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze in fase di esecuzione risiedono in `dependencies` o
  `optionalDependencies` del pacchetto del plugin
- le importazioni SDK/core sono peer o importazioni OpenClaw fornite
- i plugin di sviluppo locali portano le proprie dipendenze già installate
- i plugin npm e git vengono installati in radici di pacchetto possedute da OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- rilevare l'origine del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Radici di installazione

OpenClaw usa radici stabili per ogni origine:

- i pacchetti npm vengono installati sotto `~/.openclaw/npm`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/da percorso/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella radice npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa radice npm gestita
per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball, lo aggiunge
alla radice gestita come dipendenza `file:` copiata, esegue la normale installazione npm
e quindi verifica i metadati del lockfile installato prima di considerare attendibile il plugin.
Questo è pensato per prove di accettazione del pacchetto e di release candidate in cui un
artefatto pack locale deve comportarsi come l'artefatto del registro che simula.

npm può promuovere dipendenze transitive a `~/.openclaw/npm/node_modules` accanto
al pacchetto del plugin. OpenClaw analizza la radice npm gestita prima di considerare attendibile
l'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
in fase di esecuzione promosse restano dentro il confine di pulizia gestito.

I plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza peer.
OpenClaw non consente a npm di installare una copia separata dal registro del pacchetto host
nella radice gestita, perché pacchetti host obsoleti possono influire sulla risoluzione peer di npm
durante installazioni successive di plugin. Le installazioni npm gestite saltano la risoluzione/materializzazione
peer di npm per la radice condivisa e OpenClaw riafferma i collegamenti `node_modules/openclaw`
locali al plugin per i pacchetti installati che dichiarano il peer host dopo installazione,
aggiornamento o disinstallazione.

Le installazioni git clonano o aggiornano il repository, poi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene quindi caricato da quella directory di pacchetto, quindi la risoluzione di
`node_modules` locale al pacchetto e padre funziona nello stesso modo in cui funziona per un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` o riparazione delle dipendenze per essi. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso di emergenza Jiti. I plugin
JavaScript pacchettizzati e i plugin interni inclusi vengono caricati tramite
import/require nativi invece che tramite Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se manca una dipendenza in fase di esecuzione, il plugin non viene caricato e l'errore
deve indicare all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e recuperare
plugin scaricabili che mancano dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze per un plugin locale già installato.

## Plugin inclusi

I plugin inclusi leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Devono non avere un albero pesante di dipendenze in fase di esecuzione oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato attuale dei plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, vedi [Inventario dei plugin](/it/plugins/plugin-inventory).

I manifest dei plugin inclusi non devono richiedere staging delle dipendenze. Funzionalità
grandi o opzionali dei plugin devono essere pacchettizzate come un normale plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin inclusi vengono caricati da `extensions/<id>` così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono raccolte direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` alla radice del repository non è
un modo supportato per preparare le dipendenze dei plugin inclusi.

| Forma di installazione           | Posizione del plugin incluso          | Proprietario delle dipendenze                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero di esecuzione compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei plugin |
| Checkout git più `pnpm install` | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto plugin |
| `openclaw plugins install ...`   | Radice plugin npm/git/ClawHub gestita | Il flusso di installazione/aggiornamento del plugin                  |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano radici di dipendenze dei plugin inclusi all'avvio o
durante la riparazione doctor. La pulizia doctor attuale rimuove quelle directory e quei
symlink obsoleti quando si usa `--fix`, incluse le vecchie radici `plugin-runtime-deps`, i symlink
di pacchetti con prefisso Node globale che puntano a destinazioni `plugin-runtime-deps` eliminate,
i manifest `.openclaw-runtime-deps*`, i `node_modules` dei plugin generati, le directory
di staging dell'installazione e gli store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quei symlink globali prima di eliminare le radici di destinazione legacy, così gli aggiornamenti
non lasciano importazioni di pacchetti ESM pendenti.

Questi percorsi sono solo residui legacy. Le nuove installazioni non devono crearli.
