---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti Plugin
    - Stai modificando il comportamento di avvio dei Plugin, di doctor o dell'installazione tramite gestore pacchetti
    - Stai mantenendo installazioni OpenClaw pacchettizzate o manifest di Plugin in bundle
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-07-04T15:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantiene il lavoro sulle dipendenze dei plugin al momento dell'installazione/aggiornamento. Il caricamento in runtime
non esegue gestori di pacchetti, non ripara alberi di dipendenze né modifica la directory del pacchetto
OpenClaw.

## Separazione delle responsabilità

I pacchetti Plugin possiedono il proprio grafo delle dipendenze:

- le dipendenze di runtime risiedono in `dependencies` o
  `optionalDependencies` del pacchetto Plugin
- gli import SDK/core sono peer o import forniti da OpenClaw
- i plugin di sviluppo locale portano le proprie dipendenze già installate
- i plugin npm e git vengono installati in root di pacchetto di proprietà di OpenClaw

OpenClaw possiede solo il ciclo di vita del plugin:

- rilevare la sorgente del plugin
- installare o aggiornare il pacchetto quando richiesto esplicitamente
- registrare i metadati di installazione
- caricare l'entrypoint del plugin
- fallire con un errore utilizzabile quando mancano dipendenze

## Root di installazione

OpenClaw usa root stabili per sorgente:

- i pacchetti npm si installano in progetti per-plugin sotto
  `~/.openclaw/npm/projects/<encoded-package>`
- i pacchetti git vengono clonati sotto `~/.openclaw/git`
- le installazioni locali/da percorso/da archivio vengono copiate o referenziate senza riparazione delle dipendenze

Le installazioni npm vengono eseguite in quella root di progetto per-plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa la stessa root di progetto npm
per-plugin per un tarball npm-pack locale. OpenClaw legge i metadati npm del tarball,
lo aggiunge al progetto gestito come dipendenza `file:` copiata, esegue
la normale installazione npm, quindi verifica i metadati del lockfile installato prima di
fidarsi del plugin.
Questo è pensato per prove di accettazione del pacchetto e di release candidate in cui un
artefatto pack locale deve comportarsi come l'artefatto del registro che simula.

Usa `npm-pack:` quando testi pacchetti Plugin ufficiali o esterni prima della
pubblicazione. Un'installazione da archivio grezzo o da percorso è utile per il debug locale, ma
non prova lo stesso percorso di dipendenza di un pacchetto npm o ClawHub installato.
`npm-pack:` prova la forma dell'installazione del pacchetto gestito; di per sé
non è una prova che il plugin sia contenuto ufficiale collegato al catalogo.

Quando il comportamento dipende dallo stato di plugin incluso o di plugin ufficiale attendibile, abbina
la prova del pacchetto locale a un'installazione ufficiale basata sul catalogo o a un percorso di
pacchetto pubblicato che registra la fiducia ufficiale. L'accesso agli helper privilegiati e
la gestione dell'ambito attendibile-ufficiale devono essere convalidati su quel percorso di installazione
attendibile, non dedotti da un'installazione da tarball locale.

Se un plugin fallisce in runtime con un import mancante, correggi il manifest del pacchetto
invece di riparare a mano il progetto gestito. Gli import di runtime appartengono a
`dependencies` o `optionalDependencies` del pacchetto Plugin; le `devDependencies` non sono
installate per i progetti di runtime gestiti. Un `npm install` locale dentro
`~/.openclaw/npm/projects/<encoded-package>` può sbloccare una diagnostica temporanea,
ma non è una prova di accettazione del pacchetto perché la prossima installazione o aggiornamento
ricreerà il progetto dai metadati del pacchetto.

npm può hoistare dipendenze transitive nel
`node_modules` del progetto per-plugin accanto al pacchetto Plugin. OpenClaw analizza la root del progetto
gestito prima di fidarsi dell'installazione e rimuove quel progetto durante la disinstallazione, quindi
le dipendenze di runtime hoistate restano dentro il confine di pulizia di quel plugin.

I pacchetti Plugin npm pubblicati possono distribuire `npm-shrinkwrap.json`. npm usa quel
lockfile pubblicabile durante l'installazione, e la root di progetto npm gestita da OpenClaw
lo supporta tramite il normale percorso di installazione npm. I pacchetti Plugin pubblicabili
di proprietà di OpenClaw devono includere uno shrinkwrap locale al pacchetto generato dal grafo
delle dipendenze pubblicato di quel pacchetto Plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Il generatore rimuove le `devDependencies` del plugin, applica la policy di override del workspace
e scrive `extensions/<id>/npm-shrinkwrap.json` per ogni plugin
`publishToNpm`. Anche i pacchetti Plugin di terze parti possono distribuire shrinkwrap;
OpenClaw non lo richiede per i pacchetti della community, ma npm lo rispetterà
quando presente.

Prima di trattare un pacchetto locale come prova di release candidate, ispeziona il tarball
che verrà installato:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Per modifiche alle dipendenze, verifica anche che un'installazione di produzione possa risolvere i
pacchetti di runtime senza dipendenze di sviluppo:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

I pacchetti Plugin npm di proprietà di OpenClaw possono anche pubblicare con
`bundledDependencies` esplicite. Il percorso di pubblicazione npm sovrappone l'elenco dei nomi delle dipendenze
di runtime, rimuove i metadati workspace solo-dev dal manifest del pacchetto
pubblicato, esegue un'installazione npm senza script per le dipendenze di runtime
locali al pacchetto, quindi crea il pack o pubblica il tarball del plugin con quei file di dipendenza
inclusi. I pacchetti con molte dipendenze native, inclusi i runtime Codex e ACP, disattivano questa opzione
con `openclaw.release.bundleRuntimeDependencies: false`; quei pacchetti distribuiscono comunque
il proprio shrinkwrap, ma npm risolve le dipendenze di runtime durante l'installazione
invece di incorporare ogni binario di piattaforma nel tarball del plugin. Il pacchetto root
`openclaw` non include in bundle il suo intero albero delle dipendenze.

I plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza peer.
OpenClaw non consente a npm di installare una copia separata del pacchetto host dal registro
in un progetto gestito, perché pacchetti host obsoleti possono influire sulla
risoluzione peer di npm dentro quel plugin. Le installazioni npm gestite saltano la risoluzione/materializzazione
peer di npm e OpenClaw riafferma i link `node_modules/openclaw` locali al plugin
per i pacchetti installati che dichiarano il peer host dopo l'installazione o l'aggiornamento.

Le installazioni git clonano o aggiornano il repository, poi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il plugin installato viene quindi caricato da quella directory del pacchetto, quindi la risoluzione
di `node_modules` locale al pacchetto e del genitore funziona nello stesso modo di un normale
pacchetto Node.

## Plugin locali

I plugin locali sono trattati come directory controllate dallo sviluppatore. OpenClaw non
esegue `npm install`, `pnpm install` né riparazione delle dipendenze per essi. Se un
plugin locale ha dipendenze, installale in quel plugin prima di caricarlo.

I plugin locali TypeScript di terze parti possono usare il percorso Jiti di emergenza. I plugin
JavaScript pacchettizzati e i plugin interni inclusi vengono caricati tramite
import/require nativi invece di Jiti.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai dipendenze dei plugin. Leggono
i record di installazione del plugin, calcolano l'entrypoint e lo caricano.

Se una dipendenza manca in runtime, il plugin non viene caricato e l'errore
dovrebbe indirizzare l'operatore a una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` può pulire lo stato delle dipendenze legacy generato da OpenClaw e recuperare
plugin scaricabili che mancano dai record di installazione locali quando la configurazione
li referenzia. Doctor non ripara le dipendenze per un plugin locale già installato.

## Plugin inclusi

I plugin inclusi leggeri e critici per il core vengono distribuiti come parte di OpenClaw.
Non dovrebbero avere un albero pesante di dipendenze di runtime oppure dovrebbero essere spostati in un
pacchetto scaricabile su ClawHub/npm.

Per l'elenco generato corrente dei plugin distribuiti nel pacchetto core, installati
esternamente o che restano solo sorgente, vedi [Inventario dei plugin](/it/plugins/plugin-inventory).

I manifest dei plugin inclusi non devono richiedere staging delle dipendenze. Le funzionalità di plugin
grandi o opzionali devono essere pacchettizzate come un plugin normale e installate tramite
lo stesso percorso npm/git/ClawHub dei plugin di terze parti.

Nei checkout sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo
`pnpm install`, i plugin inclusi vengono caricati da `extensions/<id>` così le dipendenze
workspace locali al pacchetto sono disponibili e le modifiche vengono recepite direttamente. Lo sviluppo
da checkout sorgente è solo pnpm; un semplice `npm install` alla root del repository non è
un modo supportato per preparare le dipendenze dei plugin inclusi.

| Forma di installazione           | Posizione del plugin incluso          | Proprietario delle dipendenze                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Albero runtime compilato dentro il pacchetto | Pacchetto OpenClaw e flussi espliciti di installazione/aggiornamento/doctor dei plugin |
| Checkout Git più `pnpm install` | Pacchetti workspace `extensions/<id>` | Il workspace pnpm, incluse le dipendenze proprie di ogni pacchetto Plugin |
| `openclaw plugins install ...`   | Progetto npm gestito/root git/ClawHub | Il flusso di installazione/aggiornamento del plugin                  |

## Pulizia legacy

Le versioni precedenti di OpenClaw generavano root di dipendenze dei plugin inclusi all'avvio o
durante la riparazione doctor. La pulizia doctor corrente rimuove quelle directory e
symlink obsoleti quando si usa `--fix`, incluse vecchie root `plugin-runtime-deps`, symlink
di pacchetti del prefisso globale Node che puntano a target `plugin-runtime-deps` eliminati,
manifest `.openclaw-runtime-deps*`, `node_modules` di plugin generati, directory di
staging dell'installazione e store pnpm locali al pacchetto. Anche il postinstall pacchettizzato
rimuove quegli symlink globali prima di eliminare le root target legacy, così gli upgrade
non lasciano import di pacchetti ESM pendenti.

Anche le installazioni npm più vecchie usavano una root condivisa `~/.openclaw/npm/node_modules`.
I flussi correnti di installazione, aggiornamento, disinstallazione e doctor riconoscono ancora quella root piatta
legacy solo per recupero e pulizia. Le nuove installazioni npm dovrebbero creare invece
root di progetto per-plugin.
