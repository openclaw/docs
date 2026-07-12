---
read_when:
    - Stai eseguendo il debug delle installazioni dei pacchetti dei Plugin
    - Stai modificando il comportamento di avvio del plugin, di doctor o di installazione del gestore di pacchetti
    - Stai gestendo installazioni pacchettizzate di OpenClaw o manifest di Plugin inclusi nel pacchetto
sidebarTitle: Dependencies
summary: Come OpenClaw installa i pacchetti Plugin e risolve le dipendenze dei Plugin
title: Risoluzione delle dipendenze dei Plugin
x-i18n:
    generated_at: "2026-07-12T07:16:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw gestisce le dipendenze dei Plugin solo durante l'installazione o l'aggiornamento. Il caricamento in fase di esecuzione non esegue mai un gestore di pacchetti, non ripara un albero delle dipendenze e non modifica la directory del pacchetto OpenClaw.

## Ripartizione delle responsabilità

I pacchetti dei Plugin sono responsabili del proprio grafo delle dipendenze:

- Le dipendenze di runtime risiedono in `dependencies` o `optionalDependencies` del pacchetto del Plugin.
- Le importazioni dell'SDK o del core sono dipendenze peer oppure importazioni fornite da OpenClaw.
- I Plugin di sviluppo locali includono le proprie dipendenze già installate.
- I Plugin npm e git vengono installati in radici dei pacchetti gestite da OpenClaw.

OpenClaw è responsabile solo del ciclo di vita dei Plugin:

- Individuare l'origine del Plugin.
- Installare o aggiornare il pacchetto quando richiesto esplicitamente.
- Registrare i metadati dell'installazione.
- Caricare il punto di ingresso del Plugin.
- Generare un errore con indicazioni operative quando mancano dipendenze.

## Radici di installazione

OpenClaw utilizza radici stabili per ciascuna origine:

- I pacchetti npm vengono installati in progetti separati per ciascun Plugin in `~/.openclaw/npm/projects/<encoded-package>`.
- I pacchetti git vengono clonati in `~/.openclaw/git`.
- Le installazioni locali, da percorso o da archivio vengono copiate o referenziate senza riparare le dipendenze.

Le installazioni npm vengono eseguite nella radice del progetto specifico del Plugin con:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` utilizza la stessa radice del progetto npm specifico del Plugin per un tarball npm-pack locale: OpenClaw legge i metadati npm del tarball, lo aggiunge al progetto gestito come dipendenza `file:` copiata, esegue la normale installazione npm riportata sopra e verifica quindi i metadati del lockfile installato prima di considerare attendibile il Plugin. Questo percorso è destinato alla verifica dell'accettazione del pacchetto e delle versioni candidate, nei casi in cui un artefatto di pacchetto locale debba comportarsi come l'artefatto del registro che simula.

Utilizzare `npm-pack:` per testare i pacchetti di Plugin ufficiali o esterni prima della pubblicazione. Un'installazione da archivio non elaborato o da percorso è utile per il debug locale, ma non verifica lo stesso percorso delle dipendenze di un pacchetto npm o ClawHub installato. `npm-pack:` verifica la struttura dell'installazione del pacchetto gestito; da solo non dimostra che il Plugin sia contenuto ufficiale collegato al catalogo.

Quando il comportamento dipende dallo stato di Plugin incluso o di Plugin ufficiale attendibile, affiancare alla verifica del pacchetto locale un'installazione ufficiale basata sul catalogo o un percorso di pacchetto pubblicato che registri l'attendibilità ufficiale. L'accesso agli helper privilegiati e la gestione dell'ambito ufficiale attendibile devono essere convalidati su tale percorso di installazione attendibile, non dedotti da un'installazione mediante tarball locale.

Se un Plugin non funziona in fase di esecuzione a causa di un'importazione mancante, correggere il manifesto del pacchetto anziché riparare manualmente il progetto gestito. Le importazioni di runtime devono essere dichiarate in `dependencies` o `optionalDependencies` del pacchetto del Plugin; le `devDependencies` non vengono installate per i progetti di runtime gestiti. Un `npm install` locale all'interno di `~/.openclaw/npm/projects/<encoded-package>` può sbloccare una diagnosi temporanea, ma non costituisce una verifica dell'accettazione del pacchetto, poiché l'installazione o l'aggiornamento successivo ricrea il progetto dai metadati del pacchetto.

npm può spostare le dipendenze transitive nel `node_modules` del progetto specifico del Plugin, accanto al pacchetto del Plugin. OpenClaw esamina la radice del progetto gestito prima di considerare attendibile l'installazione e rimuove tale progetto durante la disinstallazione, quindi le dipendenze di runtime spostate restano all'interno del perimetro di pulizia del relativo Plugin.

I pacchetti di Plugin npm pubblicati possono includere `npm-shrinkwrap.json`; npm utilizza questo lockfile pubblicabile durante l'installazione e la radice del progetto npm gestito da OpenClaw lo supporta tramite il normale percorso di installazione. I pacchetti di Plugin pubblicabili gestiti da OpenClaw devono includere uno shrinkwrap locale al pacchetto generato dal grafo delle dipendenze pubblicate di tale pacchetto:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Il generatore rimuove le `devDependencies` del Plugin, applica i criteri di override del workspace e scrive `extensions/<id>/npm-shrinkwrap.json` per ogni Plugin con `openclaw.release.publishToNpm: true`. Anche i pacchetti di Plugin di terze parti possono includere uno shrinkwrap; OpenClaw non lo richiede per i pacchetti della community, ma npm lo rispetta quando è presente.

Prima di considerare un pacchetto locale come verifica di una versione candidata, esaminare il tarball che verrà installato:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Per le modifiche alle dipendenze, verificare inoltre che un'installazione di produzione possa risolvere i pacchetti di runtime senza dipendenze di sviluppo:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

I pacchetti di Plugin npm gestiti da OpenClaw possono anche essere pubblicati con `bundledDependencies` esplicite. Il percorso di pubblicazione npm sovrappone l'elenco dei nomi delle dipendenze di runtime, rimuove dal manifesto pubblicato i metadati del workspace destinati esclusivamente allo sviluppo, esegue un'installazione npm senza script per le dipendenze di runtime locali al pacchetto, quindi crea o pubblica il tarball del Plugin includendo i file di tali dipendenze. I pacchetti con un uso intensivo di componenti nativi (Codex, ACPX, Copilot, llama.cpp, memory-lancedb, Tlon) disattivano questa funzionalità con `openclaw.release.bundleRuntimeDependencies: false`; continuano a includere uno shrinkwrap, ma npm risolve le dipendenze di runtime durante l'installazione anziché incorporare nel tarball del Plugin tutti i file binari delle varie piattaforme. Il pacchetto radice `openclaw` non include l'intero albero delle proprie dipendenze.

I Plugin che importano `openclaw/plugin-sdk/*` dichiarano `openclaw` come dipendenza peer. OpenClaw impedisce a npm di installare in un progetto gestito una copia separata del pacchetto host proveniente dal registro, perché un pacchetto host obsoleto può influire sulla risoluzione delle dipendenze peer di npm all'interno del Plugin. Le installazioni npm gestite omettono la risoluzione e la materializzazione delle dipendenze peer da parte di npm e OpenClaw ripristina i collegamenti locali del Plugin in `node_modules/openclaw` per i pacchetti installati che dichiarano la dipendenza peer dall'host, dopo l'installazione o l'aggiornamento.

Le installazioni git clonano o aggiornano il repository, quindi eseguono:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Il Plugin installato viene quindi caricato dalla directory del pacchetto, perciò la risoluzione tramite `node_modules` locale al pacchetto e quello della directory padre funziona come per un normale pacchetto Node.

## Plugin locali

I Plugin locali sono directory controllate dagli sviluppatori. OpenClaw non esegue mai `npm install`, `pnpm install` o la riparazione delle dipendenze per tali directory; se un Plugin locale presenta dipendenze, installarle nel Plugin prima di caricarlo.

I Plugin TypeScript locali di terze parti vengono caricati tramite Jiti come percorso di emergenza. I Plugin JavaScript pacchettizzati e i Plugin interni inclusi vengono invece caricati tramite import/require nativo.

## Avvio e ricaricamento

L'avvio del Gateway e il ricaricamento della configurazione non installano mai le dipendenze dei Plugin. Leggono i record di installazione dei Plugin, calcolano il punto di ingresso e lo caricano.

Una dipendenza mancante in fase di esecuzione impedisce il caricamento del Plugin con un errore che indica all'operatore una correzione esplicita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` elimina lo stato obsoleto delle dipendenze generato da OpenClaw e può ripristinare i Plugin scaricabili assenti dai record di installazione locali quando sono ancora referenziati dalla configurazione. Doctor non ripara le dipendenze di un Plugin locale già installato.

## Plugin inclusi

I Plugin inclusi leggeri ed essenziali per il core vengono distribuiti come parte di OpenClaw. Non devono avere un pesante albero delle dipendenze di runtime oppure devono essere trasferiti in un pacchetto scaricabile su ClawHub/npm.

Per l'elenco attuale generato dei Plugin distribuiti nel pacchetto core, installati esternamente o disponibili solo come codice sorgente, consultare [Inventario dei Plugin](/it/plugins/plugin-inventory).

I manifesti dei Plugin inclusi non devono richiedere la preparazione delle dipendenze. Le funzionalità dei Plugin di grandi dimensioni o facoltative devono essere pacchettizzate come normali Plugin e installate tramite lo stesso percorso npm/git/ClawHub utilizzato dai Plugin di terze parti.

Nei checkout del codice sorgente, OpenClaw tratta il repository come un monorepo pnpm. Dopo `pnpm install`, i Plugin inclusi vengono caricati da `extensions/<id>`, affinché le dipendenze del workspace locali al pacchetto siano disponibili e le modifiche vengano applicate direttamente. Lo sviluppo da un checkout del codice sorgente supporta esclusivamente pnpm; un semplice `npm install` nella radice del repository non prepara le dipendenze dei Plugin inclusi.

| Tipo di installazione             | Posizione del Plugin incluso                   | Responsabile delle dipendenze                                                  |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `npm install -g openclaw`         | Albero di runtime compilato nel pacchetto      | Il pacchetto OpenClaw e i flussi espliciti di installazione/aggiornamento/doctor dei Plugin |
| Checkout git più `pnpm install`   | Pacchetti del workspace `extensions/<id>`      | Il workspace pnpm, incluse le dipendenze proprie di ciascun pacchetto di Plugin |
| `openclaw plugins install ...`    | Radice gestita npm/git/ClawHub                 | Il flusso di installazione/aggiornamento del Plugin                             |

## Pulizia dello stato obsoleto

Le versioni precedenti di OpenClaw generavano radici delle dipendenze per i Plugin inclusi all'avvio o durante la riparazione mediante doctor. L'attuale pulizia di doctor rimuove con `--fix` tali directory e collegamenti simbolici obsoleti, incluse le vecchie radici `plugin-runtime-deps`, i collegamenti simbolici globali dei pacchetti nel prefisso Node che puntano a destinazioni `plugin-runtime-deps` eliminate, i manifesti `.openclaw-runtime-deps*`, i `node_modules` generati dei Plugin, le directory intermedie di installazione e gli archivi pnpm locali ai pacchetti. Anche il postinstall del pacchetto rimuove tali collegamenti simbolici globali prima di eliminare le radici di destinazione obsolete, in modo che gli aggiornamenti non lascino importazioni di pacchetti ESM interrotte.

Le installazioni npm precedenti utilizzavano inoltre una radice condivisa `~/.openclaw/npm/node_modules`. Gli attuali flussi di installazione, aggiornamento, disinstallazione e doctor continuano a riconoscere questa radice piatta obsoleta esclusivamente per il ripristino e la pulizia. Le nuove installazioni npm creano invece radici di progetto specifiche per ciascun Plugin.
