---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, di doctor o dell'installazione tramite gestore di pacchetti
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest dei Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze del Plugin
x-i18n:
    generated_at: "2026-05-10T19:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene il lavoro sulle dipendenze dei plugin nella fase di installazione/aggiornamento. Il caricamento a runtime
non esegue gestori di pacchetti, non ripara alberi delle dipendenze né modifica la directory del pacchetto OpenClaw.

## Suddivisione delle responsabilità

I pacchetti plugin sono responsabili del proprio grafo delle dipendenze:

- le dipendenze di runtime risiedono in `dependencies` o
  `optionalDependencies` del pacchetto plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locale portano le proprie dipendenze già installate
- i plugin npm e git sono installati in root di pacchetti di proprietà di OpenClaw

OpenClaw è responsabile solo del ciclo di vita dei plugin:

- individuare la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per sorgente:

- i pacchetti npm vengono installati sotto `~/.openclaw/npm`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/da percorso/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella root npm con:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa root npm gestita
per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball, lo aggiunge
alla root gestita come dipendenza `file:` copiata, esegue la normale installazione npm,
e poi verifica i metadati del lockfile installato prima di considerare attendibile il plugin.
Questo è pensato per la prova di accettazione del pacchetto e dei candidati al rilascio, dove un
artefatto pack locale dovrebbe comportarsi come l'artefatto di registro che simula.

npm può portare le dipendenze transitive in `~/.openclaw/npm/node_modules` accanto
al pacchetto plugin. OpenClaw analizza la root npm gestita prima di considerare attendibile
l'installazione e usa npm per rimuovere i pacchetti gestiti da npm durante la disinstallazione, quindi le dipendenze
di runtime portate restano all'interno del confine di pulizia gestito.

I plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza
peer. OpenClaw non consente a npm di installare una copia separata dal registro del
pacchetto host nella root gestita, perché pacchetti host obsoleti possono influenzare la
risoluzione peer di npm durante installazioni successive di plugin. Le installazioni npm gestite saltano la
risoluzione/materializzazione peer di npm per la root condivisa e OpenClaw ripristina i link
`node_modules/openclaw` locali al plugin per i pacchetti installati che dichiarano
il peer host dopo installazione, aggiornamento o disinstallazione.

Le installazioni git clonano o aggiornano il repository, poi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene quindi caricato da quella directory del pacchetto, quindi la risoluzione di
`node_modules` locale al pacchetto e del genitore funziona nello stesso modo in cui funziona per un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dagli sviluppatori. OpenClaw non esegue
`npm install`, `pnpm install` né la riparazione delle dipendenze per essi. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso di emergenza Jiti. I plugin
JavaScript pacchettizzati e i plugin interni inclusi vengono caricati tramite
import/require nativi invece di Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai le dipendenze dei plugin. Leggono
i record di installazione dei plugin, calcolano l'entrypoint e lo caricano.

Se manca una dipendenza in runtime, il caricamento del plugin non riesce e l'errore
dovrebbe indicare all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato delle dipendenze legacy generato da OpenClaw e recuperare
i plugin scaricabili che mancano dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze per un plugin locale già installato.

## Plugin inclusi

I plugin inclusi leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Dovrebbero non avere un albero pesante di dipendenze runtime oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, consulta [Inventario dei plugin](/it/plugins/plugin-inventory).

I manifest dei plugin inclusi non devono richiedere la preparazione delle dipendenze. Le funzionalità
grandi o opzionali dei plugin dovrebbero essere pacchettizzate come un plugin normale e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come una monorepo pnpm. Dopo
`pnpm install`, i plugin inclusi vengono caricati da `extensions/<id>`, così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono rilevate direttamente. Lo sviluppo da
checkout sorgente è solo pnpm; un semplice `npm install` nella root del repository non è
un modo supportato per preparare le dipendenze dei plugin inclusi.

| Forma di installazione           | Posizione del plugin incluso          | Proprietario delle dipendenze                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei plugin |
| Checkout Git più `pnpm install` | Pacchetti workspace `extensions/<id>`  | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto plugin |
| `openclaw plugins install ...`   | Root plugin npm/git/ClawHub gestita   | Il flusso di installazione/aggiornamento dei plugin                 |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano root di dipendenze dei plugin inclusi all'avvio o
durante la riparazione con doctor. La pulizia attuale di doctor rimuove tali directory e
symlink obsoleti quando si usa `--fix`, incluse le vecchie root `plugin-runtime-deps`, i symlink
dei pacchetti con prefisso globale Node che puntano a target `plugin-runtime-deps` eliminati,
i manifest `.openclaw-runtime-deps*`, i `node_modules` generati dei plugin, le directory
di staging dell'installazione e gli store pnpm locali al pacchetto. Anche il postinstall del pacchetto
rimuove tali symlink globali prima di eliminare le root target legacy, così gli aggiornamenti
non lasciano import di pacchetti ESM pendenti.

Questi percorsi sono solo residui legacy. Le nuove installazioni non dovrebbero crearli.
