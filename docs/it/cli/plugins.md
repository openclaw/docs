---
read_when:
    - Vuoi installare o gestire i Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (elenco, installazione, marketplace, disinstallazione, abilitazione/disabilitazione, diagnostica)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T17:54:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/it/tools/plugin">
    Guida per utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Manage plugins" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Plugin bundles" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Plugin manifest" href="/it/plugins/manifest">
    Campi del manifesto e schema di configurazione.
  </Card>
  <Card title="Security" href="/it/gateway/security">
    Rafforzamento della sicurezza per le installazioni dei Plugin.
  </Card>
</CardGroup>

## Comandi

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Per indagare su installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive le tempistiche delle fasi
su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Usa invece la sorgente Nix per questa installazione al posto di `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifesti di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
I nomi di pacchetto semplici installano da npm per impostazione predefinita durante la transizione di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti Plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; vedi l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` intatto. Gli include root, gli array di include e gli include con override sibling falliscono in modo chiuso invece di essere appiattiti. Vedi [include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di ripristino dei Plugin inclusi per i Plugin che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` si applica solo alle installazioni npm. Non è supportato con le installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente fissata. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** bypassa i blocchi delle policy degli hook `before_install` dei Plugin e **non** bypassa gli errori di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze delle Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di Skills da ClawHub.

    Se un Plugin che hai pubblicato su ClawHub è bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Le spec Git/URL/file e gli intervalli semver sono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm. Le root npm gestite dei Plugin ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze Plugin hoisted.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetto semplici installano direttamente da npm durante la transizione di lancio.

    Le spec semplici e `@latest` restano sul canale stabile. Le versioni di correzione OpenClaw datate come `2026.5.3-1` sono release stabili per questo controllo. Se npm risolve una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione semplice corrisponde a un id Plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec scoped esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clone completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per eseguire il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, eseguono il checkout del ref richiesto quando presente, poi usano il normale programma di installazione della directory Plugin. Questo significa che la validazione del manifesto, la scansione del codice pericoloso, il lavoro di installazione del package manager e i record di installazione si comportano come le installazioni npm. Le installazioni git registrate includono l'URL/ref della sorgente più il commit risolto, così `openclaw plugins update` può risolvere nuovamente la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi gateway e comandi CLI. Se il Plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido alla root del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi
    testare lo stesso percorso di installazione npm-root gestito usato dalle installazioni da registro,
    inclusi la verifica di `package-lock.json`, la scansione delle dipendenze hoisted e
    i record di installazione npm. I percorsi di archivio semplici installano ancora come archivi locali
    sotto la root delle estensioni Plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un locator esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec Plugin compatibili con npm semplici installano da npm per impostazione predefinita durante la transizione di lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica la compatibilità dichiarata dell'API dei plugin / minima del Gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il pacchetto npm versionato `.tgz`, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso di archivio. Le versioni ClawHub meno recenti senza metadati ClawPack continuano a essere installate tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati di origine ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione conservano una specifica registrata senza versione, così `openclaw plugins update` può seguire le release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano vincolati a quel selettore.

#### Abbreviazione Marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente l'origine del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Origini Marketplace">
    - un nome Claude noto per marketplace da `~/.claude/plugins/known_marketplaces.json`
    - una radice marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole dei marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta origini con percorso relativo da quel repository e rifiuta origini plugin HTTP(S), con percorso assoluto, git, GitHub e altre origini plugin non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` / `lspServers` dichiarati dal manifest, command-skills Cursor e directory hook Codex compatibili; le altre capacità dei bundle rilevate sono mostrate in diagnostica/info, ma non sono ancora collegate all'esecuzione runtime.
</Note>

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Mostra solo i plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per plugin con metadati di origine/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile da macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, criterio degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per distribuzioni remote/container, verifica di riavviare il processo figlio effettivo `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se quei nomi di pacchetto
sono presenti lungo il normale percorso di ricerca Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un package manager né ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti né carica codice runtime dei plugin. I risultati della ricerca includono nome pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare su plugin inclusi in un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
resta inattiva, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per ripulire lo stato legacy delle dipendenze o recuperare plugin scaricabili mancanti referenziati dalla configurazione.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso della configurazione e integrità RPC.
- Gli hook di conversazione non inclusi nel bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo non vincolato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è l'origine durevole dei metadati di installazione, inclusi i record per manifest plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro plugin a freddo.

Quando OpenClaw rileva record legacy distribuiti `plugins.installs` nella configurazione, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Scritture esplicite dei plugin e `openclaw doctor --fix` spostano quei record nell'indice dei plugin e rimuovono la chiave di configurazione quando le scritture della configurazione sono consentite; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record dei plugin da `plugins.entries`, dall'indice persistente dei plugin, dalle voci degli elenchi allow/deny dei plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova all'interno della radice delle estensioni plugin di OpenClaw. Per i plugin di memoria attiva, lo slot di memoria viene reimpostato su `memory-core`.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni plugin tracciate nell'indice dei plugin gestiti e alle installazioni hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione id plugin vs specifica npm">
    Quando passi un id plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Questo significa che dist-tag salvati in precedenza come `@beta` e versioni esatte vincolate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome pacchetto tornando al record plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso tornando al record plugin tracciato. Usalo quando un plugin era vincolato a una versione esatta e vuoi riportarlo alla linea di release predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la specifica del plugin tracciata, a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica predefinita/latest registrata se non esiste una release beta del plugin. Versioni esatte e tag espliciti restano vincolati a quel selettore.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw verifica la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità salvato e l'hash dell'artefatto recuperato cambia, OpenClaw lo considera deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca un criterio esplicito di continuazione.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione del codice pericoloso integrata durante gli aggiornamenti dei plugin. Continua a non bypassare blocchi dei criteri plugin `before_install` o il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, origine, capacità del manifest, flag dei criteri, diagnostica, metadati di installazione, capacità del bundle ed eventuale supporto rilevato per server MCP o LSP senza importare di default il runtime del plugin. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà del plugin sono installati come gruppi di comandi root `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un solo tipo di capability (ad es. un Plugin solo provider)
- **hybrid-capability** — più tipi di capability (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capability o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capability

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello di capability.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a scripting e audit. `inspect --all` visualizza una tabella per tutta la flotta con colonne per forma, tipi di capability, avvisi di compatibilità, capability del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Diagnostica

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è corretto stampa `No plugin issues detected.`

Se un Plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la convalida della configurazione mantiene la voce del Plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del Plugin bloccato, come la proprietà del percorso o i permessi scrivibili da tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei Plugin è il modello di lettura a freddo persistito di OpenClaw per identità dei Plugin installati, abilitazione, metadati di origine e proprietà dei contributi. Il normale avvio, la ricerca del proprietario del provider, la classificazione della configurazione dei canali e l'inventario dei Plugin possono leggerlo senza importare moduli runtime dei Plugin.

Usa `plugins registry` per verificare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistito dei Plugin, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche derive npm gestite adiacenti al registro: se un pacchetto `@openclaw/*` orfano o recuperato sotto la root npm gestita dei Plugin oscura un Plugin in bundle, doctor rimuove quel pacchetto obsoleto e ricostruisce il registro, così l'avvio viene convalidato rispetto al manifest in bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il ripristino di emergenza dell'avvio durante il rollout della migrazione.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del marketplace accetta un percorso locale del marketplace, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta dell'origine risolta più il manifest del marketplace analizzato e le voci dei Plugin.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
