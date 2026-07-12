---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o bundle compatibili
    - Vuoi creare la struttura di base o convalidare un semplice Plugin per strumenti
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (inizializzazione, compilazione, convalida, elenco, installazione, marketplace, disinstallazione, abilitazione/disabilitazione, diagnostica)
title: Plugin
x-i18n:
    generated_at: "2026-07-12T06:56:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per gli utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Gestire i Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest del Plugin" href="/it/plugins/manifest">
    Campi del manifest e schema di configurazione.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security">
    Rafforzamento della sicurezza per le installazioni dei Plugin.
  </Card>
</CardGroup>

## Comandi

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Per analizzare operazioni lente di installazione, ispezione, disinstallazione o aggiornamento del registro, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive su stderr le durate delle fasi
e mantiene analizzabile l'output JSON. Consulta [Debug](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` è immutabile. `install`, `update`, `uninstall`, `enable` e `disable` si rifiutano tutti di essere eseguiti. Modifica invece la sorgente Nix per questa installazione (`programs.openclaw.config` o `instances.<name>.config` per nix-openclaw), quindi ricompila. Consulta l'[Avvio rapido](https://github.com/openclaw/nix-openclaw#quick-start) orientato agli agenti.
</Note>

<Note>
I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il Plugin del browser incluso); altri richiedono `plugins enable`.

I Plugin nativi di OpenClaw includono `openclaw.plugin.json` con uno schema JSON incorporato (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/informazioni mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) e le funzionalità rilevate del bundle.
</Note>

## Creazione

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Per impostazione predefinita, `plugins init` crea un Plugin di strumenti TypeScript minimale. Il primo
argomento è l'id del Plugin; `--name` imposta il nome visualizzato. OpenClaw usa
l'id per la directory di output predefinita e per il nome del pacchetto. Le strutture iniziali degli strumenti usano
`defineToolPlugin` e generano gli script `plugin:build` e
`plugin:validate` in `package.json`, che compilano e quindi chiamano `openclaw plugins build`/`validate`.

`plugins build` importa il punto di ingresso compilato, legge i metadati statici degli strumenti, scrive
`openclaw.plugin.json` e mantiene sincronizzato `openclaw.extensions` di `package.json`.
`plugins validate` verifica che il manifest generato, i metadati del pacchetto e
l'esportazione corrente del punto di ingresso siano ancora coerenti. Consulta [Plugin di strumenti](/it/plugins/tool-plugins) per
il flusso di lavoro di creazione completo.

La struttura iniziale scrive il codice sorgente TypeScript, ma genera i metadati dal punto di ingresso compilato
`./dist/index.js`, quindi il flusso di lavoro funziona anche con la CLI pubblicata. Usa
`--entry <path>` quando il punto di ingresso non è quello predefinito del pacchetto. Usa
`plugins build --check` nella CI per generare un errore quando i metadati generati sono obsoleti, senza
riscrivere i file.

### Struttura iniziale del provider

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Le strutture iniziali dei provider creano un Plugin generico per provider di modelli compatibile con OpenAI,
con il supporto per l'autenticazione tramite chiave API, uno script `npm run validate` che esegue
`clawhub package validate`, metadati del pacchetto ClawHub e un flusso di lavoro GitHub Actions
avviato manualmente per la futura pubblicazione attendibile tramite GitHub
OIDC. Le strutture iniziali dei provider non generano Skills e non usano
`openclaw plugins build`/`validate`; questi comandi sono destinati al percorso dei metadati generati
della struttura iniziale degli strumenti.

Prima della pubblicazione, sostituisci l'URL di base dell'API segnaposto, il catalogo dei modelli, il percorso
della documentazione, il testo delle credenziali e il contenuto del README con i dettagli reali del provider. Usa il
README generato per la prima pubblicazione su ClawHub e per la configurazione dell'editore attendibile.

## Installazione

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

I manutentori che verificano le installazioni durante la configurazione possono sovrascrivere le sorgenti automatiche
di installazione dei Plugin tramite variabili di ambiente protette. Consulta
[Sostituzioni delle sorgenti di installazione dei Plugin](/it/plugins/install-overrides).

<Warning>
Durante la transizione del lancio, i nomi di pacchetto senza prefisso vengono installati da npm per impostazione predefinita, a meno che non corrispondano all'id di un Plugin incluso o ufficiale; in tal caso OpenClaw usa la copia locale/ufficiale anziché accedere al registro npm. Usa `npm:<package>` quando desideri deliberatamente un pacchetto npm esterno. Usa `clawhub:<package>` per ClawHub. Considera l'installazione di un Plugin equivalente all'esecuzione di codice; preferisci versioni bloccate.
</Warning>

`plugins search` interroga ClawHub per cercare pacchetti `code-plugin` e
`bundle-plugin` installabili (non Skills; per queste usa `openclaw skills search`).
Il valore predefinito di `--limit` è 20, con un massimo di 100. Il comando legge solo il catalogo remoto: non esegue
alcuna ispezione dello stato locale, modifica della configurazione, installazione di pacchetti o caricamento del runtime
dei Plugin. I risultati includono il nome del pacchetto ClawHub, la famiglia, il canale, la versione,
il riepilogo e un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub è il principale canale di distribuzione e individuazione per la maggior parte dei Plugin. Npm
rimane un percorso supportato sia come alternativa sia per l'installazione diretta. I pacchetti di Plugin
`@openclaw/*` di proprietà di OpenClaw vengono nuovamente pubblicati su npm; consulta l'elenco aggiornato
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o
l'[inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta`, quando disponibile,
con ripiego su `latest`. Sul canale stabile esteso, i Plugin npm ufficiali
con indicazione assente/predefinita o `latest` vengono risolti alla versione esatta del core
installato. I blocchi a versioni esatte e i tag espliciti diversi da `latest`, i pacchetti di terze parti e
le sorgenti non npm non vengono riscritti.
</Note>

<AccordionGroup>
  <Accordion title="Inclusioni di configurazione e riparazione della configurazione non valida">
    Se la sezione `plugins` è fornita tramite un singolo file `$include`, `plugins install/update/enable/disable/uninstall` scrive direttamente nel file incluso e lascia invariato `openclaw.json`. Le inclusioni radice, gli array di inclusioni e le inclusioni con sostituzioni adiacenti generano un errore sicuro anziché essere appiattiti. Consulta [Inclusioni di configurazione](/it/gateway/configuration) per le strutture supportate.

    Se la configurazione non è valida durante l'installazione, normalmente `plugins install` genera un errore sicuro e indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio e il ricaricamento a caldo del Gateway, una configurazione non valida del Plugin genera un errore sicuro come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce non valida del Plugin. L'unica eccezione documentata in fase di installazione è un percorso di ripristino limitato per i Plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto all'aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto di hook già installato. Usalo quando desideri reinstallare intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un Plugin npm già monitorato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per l'id di un Plugin già installato, OpenClaw si arresta e indica `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure `plugins install <package> --force` quando desideri realmente sovrascrivere l'installazione corrente da una sorgente diversa. `--force` non è supportato con `--link`.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm e registra l'esatto `<name>@<version>` risolto. Non è supportato con le installazioni `git:` (blocca invece il riferimento nella specifica, ad esempio `git:github.com/acme/plugin@v1.2.3`) né con `--marketplace` (le installazioni dal marketplace conservano i metadati della sorgente del marketplace anziché una specifica npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è deprecato e ora non esegue alcuna operazione. OpenClaw non applica più il blocco integrato del codice pericoloso durante l'installazione dei Plugin.

    Usa la superficie `security.installPolicy`, gestita dall'operatore, quando è necessaria una politica di installazione specifica per l'host. Gli hook `before_install` dei Plugin sono hook del ciclo di vita del runtime dei Plugin, non il principale confine delle politiche per le installazioni tramite CLI.

    Se un Plugin pubblicato su ClawHub viene nascosto o bloccato da una scansione del registro, segui i passaggi per gli editori descritti in [Pubblicazione su ClawHub](/it/clawhub/publishing). `--dangerously-force-unsafe-install` non richiede a ClawHub di eseguire nuovamente la scansione del Plugin né di rendere pubblica una versione bloccata.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Le installazioni dalla community di ClawHub verificano il registro di attendibilità della versione selezionata prima di scaricarla. Se ClawHub disabilita il download della versione, segnala risultati dannosi della scansione oppure assegna alla versione uno stato di moderazione bloccante (in quarantena, revocata), OpenClaw la rifiuta categoricamente indipendentemente da questo flag. Per gli stati di scansione rischiosi non bloccanti o gli stati di moderazione non bloccanti, OpenClaw mostra i dettagli sull'attendibilità e chiede conferma prima di continuare.

    Usa `--acknowledge-clawhub-risk` solo dopo aver esaminato l'avviso di ClawHub e aver deciso di continuare senza una richiesta interattiva. I risultati di scansione in sospeso o obsoleti (non ancora puliti) generano un avviso, ma non richiedono conferma. I pacchetti ClawHub ufficiali e le sorgenti dei Plugin inclusi in OpenClaw ignorano completamente questa verifica dell'attendibilità della versione.

  </Accordion>
  <Accordion title="Pacchetti di hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione dei singoli hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **limitate al registro** (nome del pacchetto più una **versione esatta** o un **dist-tag** facoltativo). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Per sicurezza, le dipendenze vengono installate in un unico progetto npm gestito per ciascun plugin con `--ignore-scripts`, anche quando la shell dispone di impostazioni globali per l'installazione npm. I progetti npm gestiti dei plugin ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i vincoli di sicurezza dell'host si applicano anche alle dipendenze dei plugin sottoposte a hoisting.

    Usa `npm:<package>` per rendere esplicita la risoluzione tramite npm. Durante la transizione al lancio, anche le specifiche di pacchetto semplici vengono installate direttamente da npm, a meno che non corrispondano all'id di un plugin ufficiale.

    Le specifiche `@openclaw/*` non elaborate che corrispondono a plugin inclusi vengono risolte nella copia inclusa di proprietà dell'immagine prima di ricorrere a npm. Ad esempio, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa il plugin Discord incluso nella build corrente di OpenClaw anziché creare una sostituzione npm gestita. Per forzare l'uso del pacchetto npm esterno, usa `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Le specifiche semplici e `@latest` rimangono sul canale stabile. Le versioni correttive di OpenClaw con data, come `2026.5.3-1`, sono considerate stabili per questo controllo. Se npm risolve una delle due forme in una versione preliminare, OpenClaw si arresta e chiede di esprimere esplicitamente il consenso con un tag di versione preliminare (`@beta`/`@rc`) o una versione preliminare esatta (`@1.2.3-beta.4`).

    Per le installazioni npm senza una versione esatta (`npm:<package>` o `npm:<package>@latest`), OpenClaw controlla i metadati del pacchetto risolto prima dell'installazione. Se il pacchetto stabile più recente richiede un'API dei plugin di OpenClaw più recente o una versione minima dell'host superiore, OpenClaw esamina le versioni stabili precedenti e installa invece la versione compatibile più recente. Le versioni esatte e i dist-tag espliciti restano rigorosi: una selezione incompatibile non riesce e chiede di aggiornare OpenClaw o scegliere una versione compatibile.

    Se una specifica di installazione semplice corrisponde all'id di un plugin ufficiale (ad esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica con ambito esplicito (ad esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository Git. Forme supportate: `git:github.com/owner/repo`, `git:owner/repo`, URL completi `https://`, `ssh://`, `git://`, `file://` e URL di clonazione `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per effettuare il checkout di un ramo, tag o commit prima dell'installazione.

    Le installazioni da Git clonano il contenuto in una directory temporanea, effettuano il checkout del riferimento richiesto quando presente, quindi usano il normale programma di installazione delle directory dei plugin; in questo modo la convalida del manifesto, i criteri di installazione dell'operatore, le operazioni di installazione del gestore di pacchetti e i record di installazione si comportano come nelle installazioni npm. Le installazioni Git registrate includono l'URL e il riferimento di origine, oltre al commit risolto, affinché `openclaw plugins update` possa risolvere nuovamente l'origine in seguito.

    Dopo l'installazione da Git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni di runtime, come i metodi del Gateway e i comandi CLI. Se il plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, ad esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi nativi dei plugin OpenClaw devono contenere un file `openclaw.plugin.json` valido nella radice estratta del plugin; gli archivi che contengono soltanto `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un archivio tar npm-pack e desideri
    usare lo stesso percorso del progetto npm gestito per plugin impiegato dalle installazioni dal registro,
    inclusi la verifica di `package-lock.json`, l'analisi delle dipendenze sottoposte a hoisting
    e i record di installazione npm. I normali percorsi degli archivi continuano a essere installati come
    archivi locali nella radice delle estensioni dei plugin.

    Sono supportate anche le installazioni dal catalogo di Claude.

  </Accordion>
</AccordionGroup>

Le installazioni da ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Durante la transizione al lancio, le specifiche semplici dei plugin compatibili con npm vengono installate da npm per impostazione predefinita, a meno che non corrispondano all'id di un plugin ufficiale:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione esclusivamente tramite npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

Prima dell'installazione, OpenClaw controlla la compatibilità dichiarata con l'API dei plugin e con la versione minima del Gateway. Quando la versione di ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il file `.tgz` npm-pack con versione, verifica l'intestazione del digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso per gli archivi. Le versioni precedenti di ClawHub prive di metadati ClawPack continuano a essere installate tramite il percorso precedente di verifica degli archivi dei pacchetti. Le installazioni registrate conservano i metadati di origine ClawHub, il tipo di artefatto, l'integrità npm, la somma SHA npm, il nome dell'archivio tar e i dati del digest ClawPack per gli aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, affinché `openclaw plugins update` possa seguire le versioni più recenti di ClawHub; i selettori espliciti di versione o tag, come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, restano vincolati a tale selettore.

### Forma abbreviata del catalogo

Usa la forma abbreviata `plugin@marketplace` quando il nome del catalogo è presente nella cache locale del registro di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` per passare esplicitamente l'origine del catalogo:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Origini del catalogo">
    - un nome di catalogo noto a Claude proveniente da `~/.claude/plugins/known_marketplaces.json`
    - una radice di catalogo locale o un percorso `marketplace.json`
    - una forma abbreviata di repository GitHub, come `owner/repo`
    - un URL di repository GitHub, come `https://github.com/owner/repo`
    - un URL Git

  </Tab>
  <Tab title="Regole per i cataloghi remoti">
    Per i cataloghi remoti caricati da GitHub o Git, le voci dei plugin devono rimanere all'interno del repository clonato del catalogo. OpenClaw accetta origini con percorsi relativi provenienti da tale repository e rifiuta nei manifesti remoti le origini dei plugin HTTP(S), con percorso assoluto, Git, GitHub e qualsiasi altra origine che non sia un percorso.
  </Tab>
</Tabs>

Per i percorsi e gli archivi locali, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- pacchetti compatibili con Codex (`.codex-plugin/plugin.json`)
- pacchetti compatibili con Claude (`.claude-plugin/plugin.json` oppure la struttura predefinita dei componenti Claude quando tale file manifesto è assente)
- pacchetti compatibili con Cursor (`.cursor-plugin/plugin.json`)

Le installazioni locali gestite devono essere directory o archivi di plugin. I file di plugin autonomi `.js`,
`.mjs`, `.cjs` e `.ts` non vengono copiati nella radice gestita dei plugin da
`plugins install`, né caricati collocandoli direttamente in
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; tali
radici rilevate automaticamente caricano directory di pacchetti o raccolte di plugin e ignorano
i file di script di primo livello considerandoli strumenti ausiliari locali. Elenca invece esplicitamente i file autonomi in
`plugins.load.paths`.

<Note>
Le raccolte compatibili vengono installate nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Attualmente sono supportati le Skills delle raccolte, le Skills di comando di Claude, i valori predefiniti di `settings.json` di Claude, i valori predefiniti di `.lsp.json` di Claude e di `lspServers` dichiarati nel manifesto, le Skills di comando di Cursor e le directory di hook compatibili con Codex; le altre funzionalità rilevate delle raccolte vengono mostrate nella diagnostica e nelle informazioni, ma non sono ancora collegate all'esecuzione di runtime.
</Note>

Usa `-l`/`--link` per puntare a una directory locale di plugin senza copiarla (viene aggiunta
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` non è supportato con `--force` (i plugin collegati puntano direttamente al percorso
di origine, quindi non vi è nulla da sovrascrivere sul posto), con `--marketplace` o con
le installazioni `git:` e richiede un percorso locale già esistente.

<Note>
I plugin provenienti dall'area di lavoro e rilevati in una radice delle estensioni dell'area di lavoro non vengono
importati né eseguiti finché non sono abilitati esplicitamente. Per lo sviluppo locale,
esegui `openclaw plugins enable <plugin-id>` oppure imposta
`plugins.entries.<plugin-id>.enabled: true`; se la configurazione usa
`plugins.allow`, includi anche lì lo stesso id del plugin. Questa regola di blocco predefinito
si applica anche quando la configurazione di un canale seleziona esplicitamente un plugin proveniente dall'area di lavoro per
il caricamento riservato alla configurazione; pertanto, il codice di configurazione del plugin locale del canale non verrà eseguito finché tale
plugin dell'area di lavoro rimane disabilitato o escluso dall'elenco di elementi consentiti. Le installazioni collegate
e le voci esplicite di `plugins.load.paths` seguono i criteri normali per
l'origine risolta del plugin. Consulta
[Configurare i criteri dei plugin](/it/tools/plugin#configure-plugin-policy)
e [Riferimento della configurazione](/it/gateway/configuration-reference#plugins).

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice gestito dei plugin, mantenendo non vincolato il comportamento predefinito.
</Note>

## Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra soltanto i plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare alle righe di dettaglio per ciascun plugin, con metadati relativi a formato, origine, provenienza, versione e attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile automaticamente, oltre alla diagnostica del registro e allo stato di installazione delle dipendenze dei pacchetti.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un ripiego derivato esclusivamente dal manifesto quando il registro è assente o non valido. È utile per controllare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una verifica in tempo reale di un processo Gateway già in esecuzione. Dopo aver modificato il codice del plugin, lo stato di abilitazione, i criteri degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di attenderti l'esecuzione del nuovo codice `register(api)` o dei nuovi hook. Per le distribuzioni remote o in container, verifica di riavviare l'effettivo processo figlio `openclaw gateway run`, non soltanto un processo wrapper.

`plugins list --json` include il valore `dependencyStatus` di ciascun plugin, ricavato da
`dependencies` e `optionalDependencies` in `package.json`. OpenClaw controlla se i nomi di tali pacchetti
sono presenti lungo il normale percorso di ricerca `node_modules` di Node usato dal plugin; non
importa il codice di runtime del plugin, non esegue un gestore di pacchetti e non ripara
le dipendenze mancanti.
</Note>

Se all'avvio viene registrato `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
esegui `openclaw plugins list --enabled --verbose` oppure
`openclaw plugins inspect <id>` con l'id di un plugin elencato per confermare gli id dei plugin
e copia gli id attendibili in `plugins.allow` all'interno di `openclaw.json`. Quando
l'avviso può elencare tutti i plugin rilevati, mostra un frammento
`plugins.allow` pronto da incollare che include già tali id. Se un plugin viene caricato
senza una provenienza da installazione o da un percorso di caricamento, esamina l'id del plugin, quindi
vincola l'id attendibile in `plugins.allow` oppure reinstalla il plugin da un'origine attendibile,
affinché OpenClaw registri la provenienza dell'installazione.

Per lavorare sui plugin inclusi all'interno di un'immagine Docker confezionata, monta tramite bind la directory
del codice sorgente del plugin sul corrispondente percorso del codice sorgente incluso, ad esempio
`/app/extensions/synology-chat`. OpenClaw rileva tale sovrapposizione del codice sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory del codice sorgente copiata
rimane inattiva, quindi le normali installazioni confezionate continuano a usare la distribuzione compilata.

Per il debug degli hook di runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra gli hook registrati e la diagnostica risultante da un passaggio di ispezione con il modulo caricato. L'ispezione in fase di esecuzione non installa mai dipendenze; usa `openclaw doctor --fix` per ripulire lo stato delle dipendenze legacy o recuperare i plugin scaricabili mancanti a cui fa riferimento la configurazione.
- `openclaw gateway status --deep --require-rpc` conferma l'URL/profilo del Gateway raggiungibile, le indicazioni sul servizio/processo, il percorso della configurazione e lo stato di integrità RPC.
- Gli hook di conversazione non inclusi nel bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indice dei plugin

I metadati di installazione dei plugin sono uno stato gestito automaticamente, non una configurazione utente. Le installazioni e gli aggiornamenti li scrivono nel database di stato SQLite condiviso, nella directory di stato attiva di OpenClaw. La riga `installed_plugin_index` archivia i metadati persistenti `installRecords`, inclusi i record relativi a manifest di plugin danneggiati o mancanti, oltre a una cache del registro a freddo derivata dai manifest e usata da `openclaw plugins update`, dalla disinstallazione, dalla diagnostica e dal registro dei plugin a freddo.

Quando OpenClaw rileva nella configurazione record legacy distribuiti in `plugins.installs`, le letture in fase di esecuzione li trattano come input di compatibilità senza riscrivere `openclaw.json`. Le scritture esplicite dei plugin e `openclaw doctor --fix` trasferiscono questi record nell'indice dei plugin e rimuovono la chiave di configurazione quando sono consentite le scritture della configurazione; se una delle due scritture non riesce, i record di configurazione vengono conservati per evitare la perdita dei metadati di installazione.

## Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` rimuove i record del plugin da `plugins.entries`, dall'indice persistente dei plugin, dalle voci degli elenchi di autorizzazione/blocco dei plugin e, ove applicabile, dalle voci collegate di `plugins.load.paths`. A meno che non sia impostato `--keep-files`, la disinstallazione rimuove anche la directory di installazione gestita e tracciata, ma soltanto quando il percorso risolto si trova all'interno della radice delle estensioni dei plugin di OpenClaw. Se il plugin occupa attualmente lo slot `memory` o `contextEngine`, tale slot viene reimpostato sul valore predefinito (`memory-core` per la memoria, `legacy` per il motore di contesto).

`uninstall` mostra un'anteprima degli elementi che verranno rimossi, quindi visualizza la richiesta `Uninstall plugin "<id>"?` prima di apportare modifiche. Passa `--force` per saltare la richiesta di conferma (utile per gli script e le esecuzioni non interattive); senza questa opzione, la disinstallazione richiede un TTY interattivo. `--dry-run` mostra la stessa anteprima ed esce senza richiedere conferma né modificare alcunché.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

## Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni dei plugin tracciate nell'indice gestito dei plugin e alle installazioni dei pacchetti di hook tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione dell'id del plugin rispetto alla specifica npm">
    Quando passi l'id di un plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Ciò significa che i dist-tag archiviati in precedenza, come `@beta`, e le versioni esatte bloccate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Durante `update <id> --dry-run`, le installazioni npm bloccate su una versione esatta rimangono tali. Se OpenClaw riesce anche a risolvere la linea predefinita del registro del pacchetto e tale linea è più recente della versione bloccata installata, l'esecuzione di prova segnala il blocco e mostra il comando esplicito di aggiornamento del pacchetto a `@latest` per seguire la linea predefinita del registro.

    Questa regola per gli aggiornamenti mirati è diversa dal percorso di manutenzione collettivo `openclaw plugins update --all`. Gli aggiornamenti collettivi continuano a rispettare le normali specifiche di installazione tracciate, ma i record attendibili dei plugin ufficiali di OpenClaw possono sincronizzarsi con la destinazione corrente del catalogo ufficiale anziché rimanere su un pacchetto ufficiale obsoleto con versione esatta. Usa l'aggiornamento mirato `update <id>` quando vuoi intenzionalmente mantenere invariata una specifica ufficiale esatta o contrassegnata.

    Per le installazioni npm, puoi anche passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw riconduce il nome del pacchetto al record del plugin tracciato, aggiorna il plugin installato e registra la nuova specifica npm per i futuri aggiornamenti basati sull'id.

    Anche il passaggio del nome del pacchetto npm senza versione o tag viene ricondotto al record del plugin tracciato. Usalo quando un plugin era bloccato su una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    Il comando mirato `openclaw plugins update <id-or-npm-spec>` riutilizza la specifica del plugin tracciata, a meno che non ne venga passata una nuova. Il comando collettivo `openclaw plugins update --all` usa il valore configurato di `update.channel` quando sincronizza i record attendibili dei plugin ufficiali con la destinazione del catalogo ufficiale, così le installazioni del canale beta possono rimanere sulla linea di rilascio beta anziché essere normalizzate silenziosamente su stable/latest.

    Anche `openclaw update` conosce il canale di aggiornamento attivo di OpenClaw: sul canale beta, i record dei plugin npm e ClawHub della linea predefinita tentano prima `@beta`. Se non esiste una versione beta del plugin, ripiegano sulla specifica predefinita/latest registrata; i plugin npm ricorrono al ripiego anche quando il pacchetto beta esiste ma non supera la convalida dell'installazione. Tale ripiego viene segnalato come avviso e non causa il fallimento dell'aggiornamento del core. Le versioni esatte e i tag espliciti rimangono bloccati su tale selettore per gli aggiornamenti mirati.

  </Accordion>
  <Accordion title="Controlli delle versioni e divergenze di integrità">
    Prima di un aggiornamento npm effettivo, OpenClaw verifica la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene ignorato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità archiviato e l'hash dell'artefatto recuperato cambia, OpenClaw considera il caso una divergenza dell'artefatto npm. Il comando interattivo `openclaw plugins update` mostra gli hash previsto ed effettivo e richiede conferma prima di procedere. Gli strumenti di aggiornamento non interattivi interrompono l'operazione in modo sicuro, a meno che il chiamante non fornisca una politica esplicita di continuazione.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante l'aggiornamento">
    `--dangerously-force-unsafe-install` è accettato anche da `plugins update` per compatibilità, ma è deprecato e non modifica più il comportamento di aggiornamento dei plugin. Il valore dell'operatore `security.installPolicy` può comunque bloccare gli aggiornamenti; gli hook `before_install` dei plugin si applicano soltanto nei processi in cui sono caricati gli hook dei plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk durante l'aggiornamento">
    Gli aggiornamenti dei plugin della community basati su ClawHub eseguono, prima di scaricare il pacchetto sostitutivo, lo stesso controllo di attendibilità della versione esatta usato per le installazioni. Usa `--acknowledge-clawhub-risk` per l'automazione sottoposta a revisione che deve continuare quando la versione ClawHub selezionata presenta un avviso di attendibilità rischioso. I pacchetti ClawHub ufficiali e le sorgenti dei plugin di OpenClaw incluse nel bundle ignorano questa richiesta relativa all'attendibilità della versione.
  </Accordion>
</AccordionGroup>

## Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

L'ispezione mostra identità, stato di caricamento, origine, funzionalità del manifest, flag delle politiche, diagnostica, metadati di installazione, funzionalità del bundle e qualsiasi supporto rilevato per server MCP o LSP, senza importare per impostazione predefinita il runtime del plugin. L'output JSON include i contratti del manifest del plugin, come `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, affinché gli operatori possano verificare le dichiarazioni relative alle superfici attendibili prima di abilitare o riavviare un plugin. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi e servizi registrati, metodi del Gateway e route HTTP. L'ispezione in fase di esecuzione segnala direttamente le dipendenze mancanti del plugin; installazioni e riparazioni rimangono di competenza di `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà dei plugin vengono generalmente installati come gruppi di comandi radice di `openclaw`, ma i plugin possono anche registrare comandi annidati sotto un elemento padre del core, come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando in `cliCommands`, eseguilo nel percorso indicato; per esempio, un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin viene classificato in base a ciò che registra effettivamente in fase di esecuzione:

| Forma                | Significato                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `plain-capability`   | esattamente un tipo di funzionalità (ad es. un plugin che fornisce soltanto un provider)     |
| `hybrid-capability`  | più di un tipo di funzionalità (ad es. testo + voce + immagini)                              |
| `hook-only`          | soltanto hook, senza funzionalità, strumenti, comandi, servizi o route                       |
| `non-capability`     | strumenti/comandi/servizi, ma nessuna funzionalità                                           |

Per ulteriori informazioni sul modello delle funzionalità, consulta [Forme dei plugin](/it/plugins/architecture#plugin-shapes).

<Note>
Il flag `--json` produce un rapporto leggibile automaticamente, adatto agli script e alle verifiche. `inspect --all` visualizza una tabella relativa a tutti i plugin, con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

## Diagnostica

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica del manifest/rilevamento, avvisi di compatibilità e riferimenti obsoleti nella configurazione dei plugin, come slot di plugin mancanti. Quando l'albero di installazione e la configurazione dei plugin non presentano problemi, mostra `No plugin issues detected.` Se rimane una configurazione obsoleta ma l'albero di installazione è altrimenti integro, il riepilogo lo specifica senza suggerire che lo stato complessivo dei plugin sia integro.

Se un plugin configurato è presente sul disco ma viene bloccato dai controlli di sicurezza dei percorsi del caricatore, la convalida della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente relativa al plugin bloccato, ad esempio la proprietà del percorso o le autorizzazioni di scrittura per tutti, anziché rimuovere `plugins.entries.<id>` o `plugins.allow` dalla configurazione.

Per gli errori relativi alla struttura del modulo, come l'assenza delle esportazioni `register`/`activate`, esegui nuovamente il comando con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere nell'output diagnostico un riepilogo compatto della struttura delle esportazioni.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello persistente di lettura a freddo di OpenClaw per l'identità dei plugin installati, la loro abilitazione, i metadati di origine e la proprietà dei contributi. L'avvio normale, la ricerca del proprietario di un provider, la classificazione della configurazione dei canali e l'inventario dei plugin possono leggerlo senza importare i moduli di runtime dei plugin.

Usa `plugins registry` per verificare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo a partire dall'indice persistente dei plugin, dalle politiche di configurazione e dai metadati dei manifest/pacchetti. Si tratta di un percorso di riparazione, non di attivazione in fase di esecuzione.

`openclaw doctor --fix` ripara anche le divergenze npm gestite adiacenti al registro: se un pacchetto `@openclaw/*` orfano o recuperato, presente in un progetto npm gestito per i plugin o nella radice npm gestita piatta legacy, mette in ombra un plugin incluso nel bundle, `doctor` rimuove il pacchetto obsoleto e ricostruisce il registro affinché l'avvio esegua la convalida rispetto al manifest incluso nel bundle. `doctor` ricollega inoltre il pacchetto host `openclaw` ai plugin npm gestiti che dichiarano `peerDependencies.openclaw`, così le importazioni di runtime locali al pacchetto, come `openclaw/plugin-sdk/*`, vengono risolte dopo gli aggiornamenti o le riparazioni npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un'opzione di compatibilità di emergenza deprecata per gli errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il ripiego tramite variabile d'ambiente serve soltanto per il ripristino di emergenza dell'avvio durante la distribuzione della migrazione.
</Warning>

## Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` elenca le voci del feed del marketplace OpenClaw configurato. Per impostazione predefinita, tenta di usare il feed ospitato e, se non è disponibile, ricorre all'ultima istantanea accettata o ai dati inclusi. Usa `--feed-profile <name>` per leggere uno specifico profilo configurato, `--feed-url <url>` per leggere l'URL esplicito di un feed ospitato e `--offline` per leggere l'ultima istantanea accettata senza recuperare il feed.

`plugins marketplace refresh` aggiorna l'istantanea del feed ospitato configurato e indica se OpenClaw ha accettato i dati ospitati, un'istantanea ospitata o i dati di riserva inclusi. Usa `--expected-sha256` quando il chiamante richiede che il comando non riesca, a meno che un nuovo payload ospitato non corrisponda a un checksum prefissato.

Il comando `list` del marketplace accetta un percorso locale del marketplace, un percorso di `marketplace.json`, una forma abbreviata di GitHub come `owner/repo`, l'URL di un repository GitHub o un URL Git. `--json` restituisce l'etichetta della sorgente risolta insieme al manifesto del marketplace analizzato e alle voci dei Plugin.

L'aggiornamento del marketplace carica un feed ospitato del marketplace OpenClaw e salva la risposta convalidata come istantanea locale del feed ospitato. Senza opzioni, usa il profilo del feed predefinito configurato. Usa `--feed-profile <name>` per aggiornare uno specifico profilo configurato, `--feed-url <url>` per aggiornare l'URL esplicito di un feed ospitato, `--expected-sha256 <sha256>` per richiedere un checksum del payload corrispondente (`sha256:<hex>` o un digest esadecimale semplice di 64 caratteri) e `--json` per un output leggibile dalla macchina. Gli URL espliciti dei feed ospitati non devono includere credenziali, stringhe di query o frammenti. Gli aggiornamenti senza checksum prefissato possono segnalare un'istantanea ospitata o un risultato di riserva incluso senza causare il fallimento del comando. Gli aggiornamenti con checksum prefissato non riescono se non accettano un nuovo payload ospitato, mentre gli aggiornamenti ospitati riusciti non riescono se OpenClaw non può salvare l'istantanea convalidata.

## Contenuti correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Riferimento della CLI](/it/cli)
- [ClawHub](/clawhub)
