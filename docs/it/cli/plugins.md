---
read_when:
    - Si desidera installare o gestire Plugin del Gateway o pacchetti compatibili
    - Si desidera creare la struttura di base o convalidare un semplice Plugin per strumenti
    - Si desidera eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (inizializzazione, compilazione, convalida, elenco, installazione, marketplace, disinstallazione, abilitazione/disabilitazione, diagnostica)
title: Plugin
x-i18n:
    generated_at: "2026-07-16T14:11:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci i plugin del Gateway, i pacchetti di hook e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di plugin" href="/it/tools/plugin">
    Guida per l'utente finale all'installazione, all'abilitazione e alla risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Gestire i plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest del plugin" href="/it/plugins/manifest">
    Campi del manifest e schema di configurazione.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security">
    Rafforzamento della sicurezza per le installazioni dei plugin.
  </Card>
</CardGroup>

## Comandi

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias di inspect
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

Per analizzare installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, eseguire il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive su stderr le tempistiche delle fasi
e mantiene analizzabile l'output JSON. Consultare [Debug](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), `openclaw.json` è immutabile. `install`, `update`, `uninstall`, `enable` e `disable` si rifiutano tutti di essere eseguiti. Modificare invece il sorgente Nix per questa installazione (`programs.openclaw.config` o `instances.<name>.config` per nix-openclaw), quindi ricompilare. Consultare la [Guida introduttiva](https://github.com/openclaw/nix-openclaw#quick-start) orientata agli agenti.
</Note>

<Note>
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin del browser incluso); altri richiedono `plugins enable`.

I plugin nativi di OpenClaw distribuiscono `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili utilizzano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/informazioni mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) insieme alle funzionalità rilevate del bundle.
</Note>

## Creazione

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` crea per impostazione predefinita un plugin di strumenti TypeScript minimale. Il primo
argomento è l'id del plugin; `--name` imposta il nome visualizzato. OpenClaw utilizza
l'id per la directory di output predefinita e per la denominazione del pacchetto. Le strutture iniziali degli strumenti utilizzano
`defineToolPlugin` e generano gli script `package.json` `plugin:build` e
`plugin:validate`, che compilano e quindi chiamano `openclaw plugins build`/`validate`.

`plugins build` importa il punto di ingresso compilato, ne legge i metadati statici degli strumenti, scrive
`openclaw.plugin.json` e mantiene allineato `openclaw.extensions` di `package.json`.
`plugins validate` verifica che il manifest generato, i metadati del pacchetto e
l'esportazione corrente del punto di ingresso siano ancora coerenti. Consultare [Plugin di strumenti](/it/plugins/tool-plugins) per
il flusso di lavoro completo di creazione.

La struttura iniziale scrive il sorgente TypeScript, ma genera i metadati dal punto di ingresso
`./dist/index.js` compilato, quindi il flusso di lavoro funziona anche con la CLI pubblicata. Utilizzare
`--entry <path>` quando il punto di ingresso non è quello predefinito del pacchetto. Utilizzare
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

Le strutture iniziali dei provider creano un plugin generico per provider di modelli compatibile con OpenAI,
con infrastruttura per l'autenticazione tramite chiave API, uno script `npm run validate` che esegue
`clawhub package validate`, metadati del pacchetto ClawHub e un flusso di lavoro GitHub Actions
avviato manualmente per la futura pubblicazione attendibile tramite GitHub
OIDC. Le strutture iniziali dei provider non generano Skills e non utilizzano
`openclaw plugins build`/`validate`; questi comandi sono destinati al percorso dei metadati generati
della struttura iniziale degli strumenti.

Prima della pubblicazione, sostituire l'URL di base API segnaposto, il catalogo dei modelli, il percorso
della documentazione, il testo delle credenziali e il contenuto del README con i dettagli reali del provider. Utilizzare il
README generato per la prima pubblicazione su ClawHub e la configurazione dell'editore attendibile.

## Installazione

```bash
openclaw plugins search "calendar"                      # cerca plugin ClawHub
openclaw plugins install @openclaw/<package>            # catalogo ufficiale attendibile
openclaw plugins install <package>                       # pacchetto npm arbitrario
openclaw plugins install clawhub:<package>                # solo ClawHub
openclaw plugins install npm:<package>                    # solo npm
openclaw plugins install npm-pack:<path.tgz>               # tarball npm-pack locale
openclaw plugins install git:github.com/<owner>/<repo>     # repository git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # percorso o archivio locale
openclaw plugins install -l <path>                         # collega invece di copiare
openclaw plugins install <plugin>@<marketplace>             # forma abbreviata del marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (esplicito)
openclaw plugins install <package> --force                  # conferma la sorgente / sovrascrive quella esistente
openclaw plugins install <package> --pin                    # fissa la versione npm risolta
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

I manutentori che verificano le installazioni durante la configurazione possono sostituire le sorgenti
automatiche di installazione dei plugin tramite variabili di ambiente protette. Consultare
[Sostituzioni dell'installazione dei plugin](/it/plugins/install-overrides).

<Warning>
Durante la transizione del lancio, i nomi semplici dei pacchetti vengono installati da npm per impostazione predefinita, a meno che non corrispondano all'id di un plugin incluso o ufficiale; in tal caso, OpenClaw utilizza la copia locale/ufficiale anziché accedere al registro npm. Utilizzare `npm:<package>` quando si desidera deliberatamente un pacchetto npm esterno. Utilizzare `clawhub:<package>` per ClawHub. Trattare le installazioni dei plugin come esecuzione di codice; preferire versioni fissate.
</Warning>

<Warning>
I pacchetti ClawHub e il catalogo incluso/ufficiale di OpenClaw sono sorgenti di installazione
attendibili. Una nuova sorgente arbitraria npm, `npm-pack:`, git, percorso/archivio locale o
marketplace mostra un avviso e richiede conferma prima di continuare. Le installazioni arbitrarie
non interattive devono passare `--force` dopo aver esaminato e considerato attendibile la sorgente. Lo stesso
flag sovrascrive una destinazione di installazione esistente quando necessario. Gli aggiornamenti normali di
un'installazione già monitorata non lo richiedono. Questa conferma è distinta da
`--acknowledge-clawhub-risk`, che si applica solo agli avvisi di attendibilità relativi alle versioni rischiose di ClawHub.
`--force` non aggira `security.installPolicy` né i restanti
controlli di sicurezza dell'installazione.
</Warning>

`plugins search` interroga ClawHub per trovare pacchetti `code-plugin` e
`bundle-plugin` installabili (non Skills; per queste utilizzare `openclaw skills search`).
Il valore predefinito di `--limit` è 20, con un massimo di 100. Legge soltanto il catalogo remoto: nessuna
ispezione dello stato locale, modifica della configurazione, installazione di pacchetti o caricamento del runtime
dei plugin. I risultati includono il nome del pacchetto ClawHub, la famiglia, il canale, la versione,
il riepilogo e un suggerimento per l'installazione come `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub è il principale canale di distribuzione e scoperta per la maggior parte dei plugin. Npm
rimane un percorso supportato di ripiego e installazione diretta. I pacchetti di plugin
`@openclaw/*` di proprietà di OpenClaw vengono nuovamente pubblicati su npm; consultare l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o
[l'inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili utilizzano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta`, quando disponibile,
con ripiego su `latest`. Sul canale stabile esteso, i plugin npm ufficiali
con intento semplice/predefinito o `latest` vengono risolti alla versione esatta del core
installato. I pin esatti e i tag espliciti diversi da `latest`, i pacchetti di terze parti e
le sorgenti non npm non vengono riscritti.
</Note>

<AccordionGroup>
  <Accordion title="Inclusioni della configurazione e riparazione della configurazione non valida">
    Se la sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive direttamente nel file incluso e lascia `openclaw.json` invariato. Le inclusioni alla radice, gli array di inclusioni e le inclusioni con sostituzioni adiacenti generano un errore anziché essere appiattiti. Consultare [Inclusioni della configurazione](/it/gateway/configuration) per le strutture supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente genera un errore e indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione del plugin non valida genera un errore come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce non valida del plugin. L'unica eccezione documentata in fase di installazione è uno specifico percorso di ripristino per plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Conferma con --force e reinstallazione rispetto ad aggiornamento">
    `--force` conferma una sorgente diversa da ClawHub senza mostrare richieste. Non aggira `security.installPolicy` né i restanti controlli di sicurezza dell'installazione. Quando il plugin o il pacchetto di hook è già installato, riutilizza anche la destinazione esistente e la sovrascrive sul posto. Utilizzarlo dopo aver esaminato una sorgente arbitraria npm, locale, archivio, git o marketplace, oppure quando si reinstalla intenzionalmente lo stesso id. Per gli aggiornamenti ordinari di un plugin npm già monitorato, preferire `openclaw plugins update <id-or-npm-spec>`.

    Se si esegue `plugins install` per l'id di un plugin già installato, OpenClaw si arresta e rimanda a `plugins update <id-or-npm-spec>` per un normale aggiornamento oppure a `plugins install <package> --force` quando si desidera realmente sovrascrivere l'installazione corrente da una sorgente diversa. Le sorgenti arbitrarie mostrano comunque l'avviso interattivo sulla provenienza; le installazioni non interattive devono passare `--force` dopo la verifica. Le sorgenti attendibili di ClawHub e del catalogo OpenClaw non lo richiedono. Con `--link`, `--force` conferma la sorgente ma non modifica la modalità di installazione con percorso collegato.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm e registra l'esatto `<name>@<version>` risolto. Non è supportato con le installazioni `git:` (fissare invece il riferimento nella specifica, ad esempio `git:github.com/acme/plugin@v1.2.3`) né con `--marketplace` (le installazioni dal marketplace conservano i metadati della sorgente marketplace anziché una specifica npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è deprecato e ora non esegue alcuna operazione. OpenClaw non esegue più il blocco integrato del codice pericoloso durante l'installazione dei plugin.

    Usare la superficie `security.installPolicy` gestita dall'operatore quando è richiesta una politica di installazione specifica dell'host. Gli hook `before_install` dei Plugin sono hook del ciclo di vita del runtime dei Plugin, non il confine principale della politica per le installazioni tramite CLI.

    Se un Plugin pubblicato su ClawHub viene nascosto o bloccato da una scansione del registro, seguire i passaggi per gli editori descritti in [Pubblicazione su ClawHub](/it/clawhub/publishing). `--dangerously-force-unsafe-install` non richiede a ClawHub di eseguire nuovamente la scansione del Plugin né di rendere pubblica una versione bloccata.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Le installazioni dalla community di ClawHub verificano il record di attendibilità della versione selezionata prima del download. Se ClawHub disabilita il download della versione, segnala risultati di scansione dannosi o pone la versione in uno stato di moderazione bloccante (in quarantena, revocata), OpenClaw la rifiuta categoricamente, indipendentemente da questo flag. Per stati di scansione rischiosi non bloccanti o stati di moderazione non bloccanti, OpenClaw mostra i dettagli sull'attendibilità e richiede una conferma prima di continuare.

    Usare `--acknowledge-clawhub-risk` solo dopo aver esaminato l'avviso di ClawHub e aver deciso di continuare senza un prompt interattivo. I risultati di scansione in sospeso o obsoleti (non ancora puliti) generano un avviso, ma non richiedono una conferma. I pacchetti ClawHub ufficiali e le sorgenti dei Plugin OpenClaw inclusi ignorano completamente questa verifica dell'attendibilità della versione.

  </Accordion>
  <Accordion title="Pacchetti di hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usare `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione dei singoli hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **limitate al registro** (nome del pacchetto più una **versione esatta** o un **dist-tag** facoltativi). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Per sicurezza, le dipendenze vengono installate in un progetto npm gestito per ciascun Plugin con `--ignore-scripts`, anche quando la shell dispone di impostazioni globali per l'installazione npm. I progetti npm gestiti dei Plugin ereditano il valore npm `overrides` a livello di pacchetto di OpenClaw, quindi i vincoli di sicurezza dell'host si applicano anche alle dipendenze dei Plugin sollevate al livello superiore.

    Usare `npm:<package>` per rendere esplicita la risoluzione npm. Durante il passaggio operativo del lancio, anche le specifiche di pacchetto semplici vengono installate direttamente da npm, a meno che non corrispondano all'id di un Plugin ufficiale.

    Le specifiche `@openclaw/*` non elaborate che corrispondono a Plugin inclusi vengono risolte nella copia inclusa e gestita dall'immagine prima di ricorrere a npm. Ad esempio, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` usa il Plugin Discord incluso nella build OpenClaw corrente invece di creare un override npm gestito. Per forzare l'uso del pacchetto npm esterno, usare `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Le specifiche semplici e `@latest` rimangono sul canale stabile. Le versioni correttive di OpenClaw contrassegnate con una data, come `2026.5.3-1`, sono considerate stabili ai fini di questa verifica. Se npm risolve una delle due forme in una versione preliminare, OpenClaw si arresta e richiede un consenso esplicito tramite un tag di versione preliminare (`@beta`/`@rc`) o una versione preliminare esatta (`@1.2.3-beta.4`).

    Per le installazioni npm senza una versione esatta (`npm:<package>` o `npm:<package>@latest`), OpenClaw verifica i metadati del pacchetto risolto prima dell'installazione. Se il pacchetto stabile più recente richiede un'API dei Plugin OpenClaw più recente o una versione minima dell'host superiore, OpenClaw esamina le versioni stabili precedenti e installa invece la versione compatibile più recente. Le versioni esatte e i dist-tag espliciti rimangono rigorosi: una selezione incompatibile non riesce e richiede di aggiornare OpenClaw o scegliere una versione compatibile.

    Se una specifica di installazione semplice corrisponde all'id di un Plugin ufficiale (ad esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usare una specifica esplicita con ambito (ad esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usare `git:<repo>` per installare direttamente da un repository Git. Forme supportate: `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e URL di clonazione `git@host:owner/repo.git`. Aggiungere `@<ref>` o `#<ref>` per eseguire il checkout di un branch, un tag o un commit prima dell'installazione.

    Le installazioni Git clonano il contenuto in una directory temporanea, eseguono il checkout del riferimento richiesto, se presente, quindi usano il normale programma di installazione da directory dei Plugin; in questo modo, la convalida del manifesto, la politica di installazione dell'operatore, le operazioni di installazione del gestore di pacchetti e i record di installazione si comportano come nelle installazioni npm. Le installazioni Git registrate includono l'URL/il riferimento della sorgente e il commit risolto, così `openclaw plugins update` può risolvere nuovamente la sorgente in seguito.

    Dopo l'installazione da Git, usare `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni di runtime, come i metodi del Gateway e i comandi CLI. Se il Plugin ha registrato una radice CLI con `api.registerCli`, eseguire quel comando direttamente tramite la CLI radice di OpenClaw, ad esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi nativi dei Plugin OpenClaw devono contenere un `openclaw.plugin.json` valido nella radice estratta del Plugin; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usare `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e si desidera
    usare lo stesso percorso del progetto npm gestito per ciascun Plugin usato dalle installazioni dal registro,
    inclusi la verifica di `package-lock.json`, la scansione delle dipendenze
    sollevate al livello superiore e i record di installazione npm. I normali percorsi di archivio continuano a essere installati come
    archivi locali nella radice delle estensioni dei Plugin.

    Sono supportate anche le installazioni dai marketplace di Claude.

  </Accordion>
</AccordionGroup>

Le installazioni da ClawHub usano un localizzatore `clawhub:<package>` esplicito:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Per impostazione predefinita, durante il passaggio operativo del lancio le specifiche semplici dei Plugin compatibili con npm vengono installate da npm, a meno che non corrispondano all'id di un Plugin ufficiale:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usare `npm:` per rendere esplicita la risoluzione esclusivamente tramite npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica la compatibilità dichiarata con l'API dei Plugin e con la versione minima del Gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il file npm-pack `.tgz` con versione, verifica l'intestazione del digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso per gli archivi. Le versioni precedenti di ClawHub senza metadati ClawPack continuano a essere installate tramite il percorso precedente di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati della sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per gli aggiornamenti successivi.
Le installazioni ClawHub senza versione conservano una specifica registrata senza versione, così `openclaw plugins update` può seguire le versioni ClawHub più recenti; i selettori espliciti di versione o tag, come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, rimangono vincolati a tale selettore.

### Forma abbreviata del marketplace

Usare la forma abbreviata `plugin@marketplace` quando il nome del marketplace esiste nella cache locale del registro di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usare `--marketplace` per specificare esplicitamente la sorgente del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sorgenti del marketplace">
    - un nome di marketplace noto a Claude proveniente da `~/.claude/plugins/known_marketplaces.json`
    - una radice del marketplace locale o un percorso `marketplace.json`
    - una forma abbreviata di repository GitHub, come `owner/repo`
    - un URL di repository GitHub, come `https://github.com/owner/repo`
    - un URL Git

  </Tab>
  <Tab title="Regole per i marketplace remoti">
    Per i marketplace remoti caricati da GitHub o Git, le voci dei Plugin devono rimanere all'interno del repository del marketplace clonato. OpenClaw accetta sorgenti con percorso relativo provenienti da tale repository e rifiuta le sorgenti dei Plugin HTTP(S), con percorso assoluto, Git, GitHub e altre sorgenti non basate su percorsi presenti nei manifesti remoti.
  </Tab>
</Tabs>

Per i percorsi e gli archivi locali, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- pacchetti compatibili con Codex (`.codex-plugin/plugin.json`)
- pacchetti compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude quando tale file manifesto è assente)
- pacchetti compatibili con Cursor (`.cursor-plugin/plugin.json`)

Le installazioni locali gestite devono essere directory o archivi di Plugin. I file di Plugin autonomi `.js`,
`.mjs`, `.cjs` e `.ts` non vengono copiati nella radice gestita dei Plugin
da `plugins install`, né caricati inserendoli direttamente in
`~/.openclaw/extensions` o `<workspace>/.openclaw/extensions`; tali
radici rilevate automaticamente caricano le directory di pacchetti o bundle dei Plugin e ignorano
i file di script di primo livello considerandoli helper locali. Elencare invece esplicitamente i file autonomi in
`plugins.load.paths`.

<Note>
I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso di elenco/informazioni/abilitazione/disabilitazione. Attualmente sono supportati le Skills dei bundle, le Skills di comando di Claude, i valori predefiniti `settings.json` di Claude, i valori predefiniti `.lsp.json` di Claude / `lspServers` dichiarati nel manifesto, le Skills di comando di Cursor e le directory di hook compatibili con Codex; le altre funzionalità rilevate nei bundle vengono mostrate nella diagnostica e nelle informazioni, ma non sono ancora collegate all'esecuzione del runtime.
</Note>

Usare `-l`/`--link` per fare riferimento a una directory locale di un Plugin senza copiarla (la aggiunge
a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` non è supportato con le installazioni `--marketplace` o `git:` e
richiede un percorso locale già esistente. Per un collegamento locale non interattivo,
specificare `--force` dopo aver esaminato la sorgente; conferma la provenienza, ma non
copia né sovrascrive la directory collegata.

<Note>
I Plugin provenienti da un'area di lavoro e rilevati dalla relativa radice delle estensioni non vengono
importati né eseguiti finché non vengono abilitati esplicitamente. Per lo sviluppo locale,
eseguire `openclaw plugins enable <plugin-id>` o impostare
`plugins.entries.<plugin-id>.enabled: true`; se la configurazione usa
`plugins.allow`, includervi anche lo stesso id del Plugin. Questa regola fail-closed
si applica anche quando la configurazione di un canale seleziona esplicitamente un Plugin proveniente da un'area di lavoro per
il caricamento riservato alla configurazione, quindi il codice di configurazione del Plugin del canale locale non viene eseguito mentre tale
Plugin dell'area di lavoro rimane disabilitato o escluso dall'elenco consentito. Le installazioni collegate
e le voci `plugins.load.paths` esplicite seguono la normale politica per la
provenienza risolta del Plugin. Consultare
[Configurare la politica dei Plugin](/it/tools/plugin#configure-plugin-policy)
e [Riferimento della configurazione](/it/gateway/configuration-reference#plugins).

Usare `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice gestito dei Plugin, mantenendo non vincolato il comportamento predefinito.
</Note>

## Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra solo i Plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per ciascun Plugin con metadati relativi a formato/sorgente/provenienza/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile dalle macchine, oltre alla diagnostica del registro e allo stato di installazione delle dipendenze dei pacchetti.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato basato solo sul manifesto quando il registro è mancante o non valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una verifica in tempo reale di un processo Gateway già in esecuzione. Dopo aver modificato il codice del plugin, l'abilitazione, la policy degli hook o `plugins.load.paths`, riavviare il Gateway che serve il canale prima di attendersi l'esecuzione del nuovo codice `register(api)` o dei nuovi hook. Per le distribuzioni remote o in container, verificare che venga riavviato il processo figlio `openclaw gateway run` effettivo, non soltanto un processo wrapper.

`plugins list --json` include il valore `dependencyStatus` di ciascun plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se i nomi di tali pacchetti
sono presenti lungo il normale percorso di ricerca `node_modules` di Node del plugin; non
importa il codice runtime del plugin, non esegue un gestore di pacchetti e non ripara le
dipendenze mancanti.
</Note>

Se all'avvio viene registrato `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
eseguire `openclaw plugins list --enabled --verbose` o
`openclaw plugins inspect <id>` con uno degli ID plugin elencati per confermare gli
ID plugin e copiare gli ID attendibili in `plugins.allow` in `openclaw.json`. Quando
l'avviso può elencare tutti i plugin rilevati, stampa un frammento
`plugins.allow` pronto da incollare che include già tali ID. Se un plugin viene caricato
senza provenienza di installazione o del percorso di caricamento, ispezionare tale ID plugin, quindi
aggiungere l'ID attendibile in `plugins.allow` oppure reinstallare il plugin da una fonte attendibile,
in modo che OpenClaw registri la provenienza dell'installazione.

Per lavorare su plugin integrati all'interno di un'immagine Docker pacchettizzata, montare tramite bind la directory
del codice sorgente del plugin sul corrispondente percorso del codice sorgente pacchettizzato, ad esempio
`/app/extensions/synology-chat`. OpenClaw rileva tale overlay del codice sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory del codice sorgente copiata
rimane inattiva, quindi le normali installazioni pacchettizzate continuano a utilizzare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra gli hook registrati e la diagnostica di un passaggio di ispezione con il modulo caricato. L'ispezione runtime non installa mai dipendenze; utilizzare `openclaw doctor --fix` per ripulire lo stato delle dipendenze legacy o recuperare plugin scaricabili mancanti a cui fa riferimento la configurazione.
- `openclaw gateway status --deep --require-rpc` conferma l'URL o il profilo Gateway raggiungibile, le indicazioni sul servizio o processo, il percorso di configurazione e l'integrità RPC.
- Gli hook di conversazione non integrati (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indice dei plugin

I metadati di installazione dei plugin sono uno stato gestito dalla macchina, non una configurazione utente. Le installazioni e gli aggiornamenti li scrivono nel database di stato SQLite condiviso nella directory di stato OpenClaw attiva. La riga `installed_plugin_index` memorizza metadati `installRecords` persistenti, inclusi i record relativi a manifesti dei plugin danneggiati o mancanti, oltre a una cache del registro a freddo derivata dai manifesti utilizzata da `openclaw plugins update`, dalla disinstallazione, dalla diagnostica e dal registro dei plugin a freddo.

Quando OpenClaw rileva nella configurazione record legacy `plugins.installs` distribuiti, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Le scritture esplicite dei plugin e `openclaw doctor --fix` spostano tali record nell'indice dei plugin e rimuovono la chiave di configurazione quando sono consentite scritture nella configurazione; se una delle due scritture non riesce, i record di configurazione vengono conservati per non perdere i metadati di installazione.

## Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` rimuove i record del plugin da `plugins.entries`, dall'indice dei plugin persistente, dalle voci degli elenchi di elementi consentiti o negati dei plugin e dalle voci `plugins.load.paths` collegate, ove applicabile. A meno che non sia impostato `--keep-files`, la disinstallazione rimuove anche la directory di installazione gestita tracciata, ma soltanto quando viene risolta all'interno della radice delle estensioni dei plugin di OpenClaw. Se il plugin occupa attualmente lo slot `memory` o `contextEngine`, tale slot viene reimpostato sul valore predefinito (`memory-core` per la memoria, `legacy` per il motore di contesto).

`uninstall` stampa un'anteprima degli elementi che verranno rimossi, quindi richiede `Uninstall plugin "<id>"?` prima di apportare modifiche. Passare `--force` per ignorare la richiesta di conferma (utile per gli script e le esecuzioni non interattive); in sua assenza, la disinstallazione richiede un TTY interattivo. `--dry-run` stampa la stessa anteprima ed esce senza mostrare richieste né modificare alcunché.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

## Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni dei plugin tracciate nell'indice dei plugin gestito e alle installazioni dei pacchetti di hook tracciate in `hooks.internal.installs`. Riutilizzano la fonte già scelta dall'utente durante l'installazione del plugin, quindi non richiedono una seconda conferma della fonte.

<AccordionGroup>
  <Accordion title="Risoluzione tra ID plugin e specifica npm">
    Quando viene passato un ID plugin, OpenClaw riutilizza la specifica di installazione registrata per tale plugin. Ciò significa che i dist-tag memorizzati in precedenza, come `@beta`, e le versioni esatte bloccate continuano a essere utilizzati nelle successive esecuzioni di `update <id>`.

    Durante `update <id> --dry-run`, le installazioni npm bloccate su una versione esatta rimangono bloccate. Se OpenClaw riesce anche a risolvere la linea predefinita del registro del pacchetto e tale linea predefinita è più recente della versione bloccata installata, l'esecuzione di prova segnala il blocco e stampa il comando esplicito di aggiornamento del pacchetto `@latest` da utilizzare per seguire la linea predefinita del registro.

    Tale regola di aggiornamento mirato differisce dal percorso di manutenzione in blocco `openclaw plugins update --all`. Gli aggiornamenti in blocco continuano a rispettare le normali specifiche di installazione tracciate, ma i record attendibili dei plugin ufficiali OpenClaw possono sincronizzarsi con la destinazione corrente del catalogo ufficiale anziché rimanere su un pacchetto ufficiale esatto obsoleto. Utilizzare `update <id>` in modo mirato quando si desidera intenzionalmente mantenere invariata una specifica ufficiale esatta o con tag.

    Per le installazioni npm, è anche possibile passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve il nome del pacchetto riconducendolo al record del plugin tracciato, aggiorna il plugin installato e registra la nuova specifica npm per i futuri aggiornamenti basati sull'ID.

    Anche il passaggio del nome del pacchetto npm senza versione o tag viene risolto riconducendolo al record del plugin tracciato. Utilizzarlo quando un plugin era bloccato su una versione esatta e si desidera riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update <id-or-npm-spec>` mirato riutilizza la specifica del plugin tracciata, a meno che non ne venga passata una nuova. `openclaw plugins update --all` in blocco utilizza il valore `update.channel` configurato quando sincronizza i record attendibili dei plugin ufficiali con la destinazione del catalogo ufficiale, affinché le installazioni del canale beta possano rimanere sulla linea di rilascio beta anziché essere normalizzate implicitamente su stable/latest.

    `openclaw update` riconosce anche il canale di aggiornamento OpenClaw attivo: sul canale beta, i record dei plugin npm e ClawHub della linea predefinita provano prima `@beta`. Se non esiste una versione beta del plugin, ripiegano sulla specifica predefinita/latest registrata; i plugin npm ripiegano anche quando il pacchetto beta esiste ma non supera la convalida dell'installazione. Tale fallback viene segnalato come avviso e non causa il fallimento dell'aggiornamento del core. Le versioni esatte e i tag espliciti rimangono bloccati su tale selettore per gli aggiornamenti mirati.

  </Accordion>
  <Accordion title="Controlli delle versioni e variazioni di integrità">
    Prima di un aggiornamento npm effettivo, OpenClaw confronta la versione del pacchetto installato con i metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene ignorato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw considera il cambiamento una variazione dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash previsto ed effettivo e richiede conferma prima di procedere. Gli strumenti di aggiornamento non interattivi si arrestano in modo sicuro, a meno che il chiamante non fornisca una policy esplicita per proseguire.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante l'aggiornamento">
    `--dangerously-force-unsafe-install` è accettato anche in `plugins update` per compatibilità, ma è deprecato e non modifica più il comportamento di aggiornamento dei plugin. Il valore `security.installPolicy` dell'operatore può comunque bloccare gli aggiornamenti; gli hook `before_install` dei plugin si applicano soltanto nei processi in cui sono caricati gli hook dei plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk durante l'aggiornamento">
    Gli aggiornamenti dei plugin della community basati su ClawHub eseguono lo stesso controllo di attendibilità della versione esatta delle installazioni prima di scaricare il pacchetto sostitutivo. Utilizzare `--acknowledge-clawhub-risk` per l'automazione sottoposta a revisione che deve proseguire quando la versione ClawHub selezionata presenta un avviso di attendibilità rischioso. I pacchetti ClawHub ufficiali e le fonti dei plugin OpenClaw integrati ignorano questa richiesta relativa all'attendibilità della versione.
  </Accordion>
</AccordionGroup>

## Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Per impostazione predefinita, l'ispezione mostra identità, stato di caricamento, fonte, funzionalità del manifesto, flag delle policy, diagnostica, metadati di installazione, funzionalità del bundle e qualsiasi supporto rilevato per server MCP o LSP, senza importare il runtime del plugin. L'output JSON include i contratti del manifesto del plugin, come `contracts.agentToolResultMiddleware` e `contracts.trustedToolPolicies`, affinché gli operatori possano verificare le dichiarazioni delle superfici attendibili prima di abilitare o riavviare un plugin. Aggiungere `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi, servizi, metodi del Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze del plugin mancanti; installazioni e riparazioni rimangono in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà dei plugin vengono solitamente installati come gruppi di comandi `openclaw` principali, ma i plugin possono anche registrare comandi nidificati sotto un elemento padre del core come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguirlo nel percorso indicato; ad esempio, un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin viene classificato in base a ciò che registra effettivamente durante l'esecuzione:

| Forma               | Significato                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | esattamente un tipo di funzionalità (ad es. un plugin solo provider)         |
| `hybrid-capability` | più di un tipo di funzionalità (ad es. testo + voce + immagini)       |
| `hook-only`         | solo hook, nessuna funzionalità, strumento, comando, servizio o route |
| `non-capability`    | strumenti/comandi/servizi ma nessuna funzionalità                       |

Per ulteriori informazioni sul modello delle funzionalità, consultare [Forme dei plugin](/it/plugins/architecture#plugin-shapes).

<Note>
Il flag `--json` produce un rapporto leggibile dalla macchina, adatto per script e verifiche. `inspect --all` visualizza una tabella relativa all'intero parco di sistemi con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/rilevamento, avvisi di compatibilità e riferimenti obsoleti nella configurazione dei plugin, ad esempio slot di plugin mancanti. Quando l'albero di installazione e la configurazione dei plugin non presentano problemi, stampa `No plugin issues detected.` Se rimane una configurazione obsoleta ma l'albero di installazione è altrimenti integro, il riepilogo lo indica senza suggerire che tutti i plugin siano pienamente operativi.

Se un plugin configurato è presente sul disco ma viene bloccato dai controlli di sicurezza dei percorsi del caricatore, la convalida della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggere la diagnostica precedente relativa al plugin bloccato, ad esempio la proprietà del percorso o i permessi di scrittura per tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori relativi alla struttura del modulo, ad esempio esportazioni `register`/`activate` mancanti, eseguire nuovamente con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere nell'output diagnostico un riepilogo compatto della struttura delle esportazioni.

## Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello persistente di lettura a freddo di OpenClaw per l'identità dei plugin installati, la relativa abilitazione, i metadati di origine e la titolarità dei contributi. Il normale avvio, la ricerca del proprietario del provider, la classificazione della configurazione dei canali e l'inventario dei plugin possono leggerlo senza importare i moduli di runtime dei plugin.

Usare `plugins registry` per verificare se il registro persistente è presente, aggiornato o obsoleto. Usare `--refresh` per ricostruirlo a partire dall'indice persistente dei plugin, dai criteri di configurazione e dai metadati del manifest/pacchetto. Si tratta di un percorso di riparazione, non di un percorso di attivazione del runtime.

`openclaw doctor --fix` corregge anche le divergenze npm gestite adiacenti al registro: se un pacchetto `@openclaw/*` orfano o recuperato, all'interno di un progetto npm gestito per plugin o nella radice npm gestita piatta legacy, prevale su un plugin incluso, doctor rimuove tale pacchetto obsoleto e ricostruisce il registro affinché l'avvio esegua la convalida rispetto al manifest incluso. Doctor ricollega inoltre il pacchetto host `openclaw` nei plugin npm gestiti che dichiarano `peerDependencies.openclaw`, affinché le importazioni di runtime locali al pacchetto, come `openclaw/plugin-sdk/*`, vengano risolte dopo aggiornamenti o riparazioni npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un'opzione di compatibilità deprecata da usare come misura di emergenza in caso di errori di lettura del registro. Preferire `plugins registry --refresh` o `openclaw doctor --fix`; il ripiego tramite variabile d'ambiente è destinato esclusivamente al ripristino di emergenza dell'avvio durante la distribuzione della migrazione.
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

`plugins marketplace entries` elenca le voci del feed del marketplace OpenClaw configurato. Per impostazione predefinita, tenta di usare il feed ospitato e, in caso di errore, ricorre all'ultima istantanea accettata o ai dati inclusi. Usare `--feed-profile <name>` per leggere uno specifico profilo configurato, `--feed-url <url>` per leggere un URL esplicito di un feed ospitato e `--offline` per leggere l'ultima istantanea accettata senza recuperare il feed.

`plugins marketplace refresh` aggiorna l'istantanea del feed ospitato configurato e indica se OpenClaw ha accettato i dati ospitati, un'istantanea ospitata o i dati inclusi di ripiego. Usare `--expected-sha256` quando il chiamante richiede che il comando non riesca, a meno che un payload ospitato recente non corrisponda a un checksum fissato.

Il comando `list` del Marketplace accetta un percorso locale del marketplace, un percorso `marketplace.json`, una forma abbreviata di GitHub come `owner/repo`, l'URL di un repository GitHub o un URL git. `--json` stampa l'etichetta dell'origine risolta, seguita dal manifest del marketplace analizzato e dalle voci dei plugin.

L'aggiornamento del Marketplace carica un feed del marketplace OpenClaw ospitato e salva la
risposta convalidata come istantanea locale del feed ospitato. Senza opzioni, usa
il profilo predefinito del feed configurato. Usare `--feed-profile <name>` per aggiornare uno
specifico profilo configurato, `--feed-url <url>` per aggiornare l'URL esplicito di un
feed ospitato, `--expected-sha256 <sha256>` per richiedere un checksum del payload corrispondente
(`sha256:<hex>` o un digest esadecimale semplice di 64 caratteri) e `--json` per
un output leggibile dalla macchina. Gli URL espliciti dei feed ospitati non devono includere
credenziali, stringhe di query o frammenti. Gli aggiornamenti senza checksum fissato possono segnalare
un'istantanea ospitata o un risultato di ripiego basato sui dati inclusi senza causare
il fallimento del comando. Gli aggiornamenti con checksum fissato non riescono se non accettano un
payload ospitato recente; inoltre, gli aggiornamenti ospitati completati non riescono se OpenClaw
non può salvare l'istantanea convalidata.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Riferimento della CLI](/it/cli)
- [ClawHub](/clawhub)
