---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, di doctor o di installazione tramite gestore di pacchetti
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest di plugin inclusi
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti di plugin e risolve le dipendenze dei plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento runtime
non esegue gestori di pacchetti, non ripara alberi di dipendenze né modifica la directory del pacchetto
OpenClaw.

## Suddivisione delle responsabilità

I pacchetti plugin sono proprietari del proprio grafo di dipendenze:

- le dipendenze runtime vivono in `dependencies` o
  `optionalDependencies` del pacchetto plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locali portano con sé le proprie dipendenze già installate
- i plugin npm e git vengono installati in root di pacchetti di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- individuare la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore attuabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per sorgente:

- i pacchetti npm vengono installati sotto `~/.openclaw/npm`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/percorso/archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella root npm con:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa root npm gestita
per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball, lo aggiunge
alla root gestita come dipendenza `file:` copiata, esegue la normale installazione npm,
quindi verifica i metadati del lockfile installato prima di fidarsi del plugin.
Questo è pensato per la package acceptance e la prova dei release candidate, dove un
artefatto pack locale dovrebbe comportarsi come l'artefatto di registro che simula.

npm può eseguire l'hoist delle dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al pacchetto plugin. OpenClaw esamina la root npm gestita prima di fidarsi
dell'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, così le dipendenze
runtime soggette a hoist restano all'interno del perimetro di pulizia gestito.

I plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza
peer. OpenClaw non permette a npm di installare una copia separata del pacchetto host
dal registro nella root gestita, perché pacchetti host obsoleti possono influire sulla
risoluzione peer di npm durante installazioni successive di plugin. Invece, dopo che npm ha terminato
di modificare la root condivisa durante installazione, aggiornamento o disinstallazione, OpenClaw riafferma
i link `node_modules/openclaw` locali al plugin per i pacchetti installati che dichiarano
il peer host.

Le installazioni git clonano o aggiornano il repository, poi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene quindi caricato da quella directory del pacchetto, quindi la risoluzione
di `node_modules` locale al pacchetto e padre funziona nello stesso modo in cui funziona per un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` o riparazioni delle dipendenze per essi. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin TypeScript locali di terze parti possono usare il percorso Jiti di emergenza. I plugin
JavaScript pacchettizzati e i plugin interni inclusi vengono caricati tramite
import/require nativi invece che tramite Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se manca una dipendenza a runtime, il caricamento del plugin fallisce e l'errore
dovrebbe indicare all'operatore una correzione esplicita:

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
Dovrebbero non avere alcun albero di dipendenze runtime pesante oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato attuale dei plugin che vengono distribuiti nel pacchetto core, si installano
esternamente o restano solo sorgente, consulta [Inventario dei Plugin](/it/plugins/plugin-inventory).

I manifest dei plugin inclusi non devono richiedere staging delle dipendenze. Le funzionalità
plugin grandi o opzionali dovrebbero essere pacchettizzate come un normale plugin e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin inclusi vengono caricati da `extensions/<id>` così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono raccolte direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` nella root del repository non è
un modo supportato per preparare le dipendenze dei plugin inclusi.

| Forma di installazione           | Posizione del plugin incluso          | Proprietario delle dipendenze                                          |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei plugin |
| Checkout git più `pnpm install`  | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ciascun pacchetto plugin |
| `openclaw plugins install ...`   | Root plugin npm/git/ClawHub gestita   | Il flusso di installazione/aggiornamento del plugin                    |

## Pulizia legacy

Le versioni più vecchie di OpenClaw generavano root di dipendenze dei plugin inclusi all'avvio o
durante la riparazione doctor. La pulizia doctor attuale rimuove quelle directory e quei
symlink obsoleti quando si usa `--fix`, incluse vecchie root `plugin-runtime-deps`, symlink
di pacchetti con prefisso Node globale che puntano a target `plugin-runtime-deps` potati,
manifest `.openclaw-runtime-deps*`, `node_modules` dei plugin generati, directory di staging
dell'installazione e store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quei symlink globali prima di potare le root target legacy, così gli aggiornamenti
non lasciano import di pacchetti ESM pendenti.

Questi percorsi sono solo residui legacy. Le nuove installazioni non dovrebbero crearli.
