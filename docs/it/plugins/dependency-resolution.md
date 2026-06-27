---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, di doctor o dell'installazione tramite package manager
    - Stai mantenendo installazioni pacchettizzate di OpenClaw o manifest di Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene il lavoro sulle dipendenze dei Plugin al momento dell'installazione/aggiornamento. Il caricamento in runtime
non esegue package manager, non ripara alberi di dipendenze né modifica la
directory del pacchetto OpenClaw.

## Suddivisione delle responsabilità

I pacchetti Plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze runtime risiedono nelle `dependencies` o
  `optionalDependencies` del pacchetto Plugin
- gli import di SDK/core sono import peer o forniti da OpenClaw
- i Plugin di sviluppo locale portano le proprie dipendenze già installate
- i Plugin npm e git vengono installati in root di pacchetto possedute da OpenClaw

OpenClaw possiede solo il ciclo di vita del Plugin:

- scoprire la sorgente del Plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del Plugin
- fallire con un errore azionabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per sorgente:

- i pacchetti npm si installano in progetti per Plugin sotto
  `~/.openclaw/npm/projects/<encoded-package>`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/da path/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite nella root del progetto per Plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa root di progetto npm
per Plugin per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball,
lo aggiunge al progetto gestito come dipendenza `file:` copiata, esegue
la normale installazione npm e quindi verifica i metadati del lockfile installato prima
di considerare attendibile il Plugin.
Questo è pensato per prove di accettazione del pacchetto e di release candidate in cui un
artefatto pack locale deve comportarsi come l'artefatto del registry che simula.

npm può sollevare dipendenze transitive nel
`node_modules` del progetto per Plugin accanto al pacchetto Plugin. OpenClaw scansiona la root
del progetto gestito prima di considerare attendibile l'installazione e rimuove quel progetto durante la disinstallazione, quindi
le dipendenze runtime sollevate restano dentro il confine di pulizia di quel Plugin.

I pacchetti Plugin npm pubblicati possono distribuire `npm-shrinkwrap.json`. npm usa quel
lockfile pubblicabile durante l'installazione, e la root del progetto npm gestito da OpenClaw
lo supporta tramite il normale percorso di installazione npm. I pacchetti
Plugin pubblicabili posseduti da OpenClaw devono includere uno shrinkwrap locale al pacchetto generato dal
grafo delle dipendenze pubblicato di quel pacchetto Plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Il generatore rimuove le `devDependencies` del Plugin, applica la policy di override
del workspace e scrive `extensions/<id>/npm-shrinkwrap.json` per ogni
Plugin `publishToNpm`. Anche i pacchetti Plugin di terze parti possono distribuire shrinkwrap;
OpenClaw non lo richiede per i pacchetti della community, ma npm lo rispetterà
quando presente.

I pacchetti Plugin npm posseduti da OpenClaw possono anche essere pubblicati con
`bundledDependencies` esplicite. Il percorso di pubblicazione npm sovrappone l'elenco dei nomi delle dipendenze
runtime, rimuove i metadati workspace solo-dev dal manifest del pacchetto
pubblicato, esegue un'installazione npm senza script per le dipendenze runtime
locali al pacchetto, quindi impacchetta o pubblica il tarball del Plugin con quei file di dipendenza
inclusi. I pacchetti con molte dipendenze native, inclusi i runtime Codex e ACP, ne escono
con `openclaw.release.bundleRuntimeDependencies: false`; quei pacchetti distribuiscono comunque
il proprio shrinkwrap, ma npm risolve le dipendenze runtime durante l'installazione
invece di incorporare ogni binario di piattaforma nel tarball del Plugin. Il pacchetto root
`openclaw` non include l'intero albero delle proprie dipendenze.

I Plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza peer.
OpenClaw non consente a npm di installare una copia separata del pacchetto host dal registry
in un progetto gestito, perché pacchetti host obsoleti possono influenzare la risoluzione peer
di npm dentro quel Plugin. Le installazioni npm gestite saltano la risoluzione/materializzazione
peer di npm e OpenClaw riafferma i link `node_modules/openclaw` locali al Plugin
per i pacchetti installati che dichiarano il peer host dopo l'installazione o l'aggiornamento.

Le installazioni git clonano o aggiornano il repository, poi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il Plugin installato viene poi caricato da quella directory di pacchetto, quindi la risoluzione
di `node_modules` locale al pacchetto e padre funziona allo stesso modo di un normale
pacchetto Node.

## Plugin locali

I Plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` o riparazioni delle dipendenze per loro. Se un
Plugin locale ha dipendenze, installale in quel Plugin prima di caricarlo.

I Plugin locali TypeScript di terze parti possono usare il percorso di emergenza Jiti. I Plugin
JavaScript pacchettizzati e i Plugin interni in bundle si caricano tramite
import/require nativi invece che Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai le dipendenze dei Plugin. Leggono
i record di installazione del Plugin, calcolano l'entrypoint e lo caricano.

Se una dipendenza manca in runtime, il Plugin non viene caricato e l'errore
dovrebbe indirizzare l'operatore a una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato legacy delle dipendenze generato da OpenClaw e recuperare
Plugin scaricabili che mancano dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze per un Plugin locale già installato.

## Plugin in bundle

I Plugin leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Dovrebbero non avere un albero pesante di dipendenze runtime oppure essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei Plugin distribuiti nel pacchetto core, installati
esternamente o mantenuti solo come sorgente, vedi [Inventario Plugin](/it/plugins/plugin-inventory).

I manifest dei Plugin in bundle non devono richiedere staging delle dipendenze. Funzionalità
Plugin grandi o opzionali dovrebbero essere pacchettizzate come Plugin normali e installate tramite
lo stesso percorso npm/git/ClawHub dei Plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come monorepo pnpm. Dopo
`pnpm install`, i Plugin in bundle vengono caricati da `extensions/<id>` così le dipendenze workspace
locali al pacchetto sono disponibili e le modifiche vengono recepite direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` alla root del repository
non è un modo supportato per preparare le dipendenze dei Plugin in bundle.

| Forma di installazione           | Posizione del Plugin in bundle        | Proprietario delle dipendenze                                          |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di install/update/doctor dei Plugin |
| Checkout Git più `pnpm install` | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto Plugin |
| `openclaw plugins install ...`   | Root npm project/git/ClawHub gestita  | Il flusso install/update del Plugin                                    |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano root di dipendenze per Plugin in bundle all'avvio o
durante la riparazione doctor. La pulizia doctor corrente rimuove quelle directory e
symlink obsoleti quando si usa `--fix`, incluse vecchie root `plugin-runtime-deps`, symlink
di pacchetti con prefisso globale Node che puntano a target `plugin-runtime-deps` eliminati,
manifest `.openclaw-runtime-deps*`, `node_modules` di Plugin generati, directory di staging
dell'installazione e store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quei symlink globali prima di eliminare le root target legacy, così gli upgrade
non lasciano import di pacchetti ESM pendenti.

Anche le installazioni npm precedenti usavano una root condivisa `~/.openclaw/npm/node_modules`.
I flussi correnti di installazione, aggiornamento, disinstallazione e doctor riconoscono ancora quella root
piatta legacy solo per recupero e pulizia. Le nuove installazioni npm dovrebbero creare
root di progetto per Plugin invece.
