---
read_when:
    - Vuoi installare o gestire plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (elenco, installazione, marketplace, disinstallazione, abilitazione/disabilitazione, diagnostica)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T09:37:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Gestire i plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest Plugin" href="/it/plugins/manifest">
    Campi del manifest e schema di configurazione.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security">
    Rafforzamento della sicurezza per le installazioni dei plugin.
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
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio provider di modelli inclusi, provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
I nomi di pacchetto senza prefisso installano da npm per impostazione predefinita durante il passaggio di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei plugin come esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti plugin installabili e stampa
nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; consulta l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione della configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Gli include root, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di appiattirsi. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di recupero dei plugin inclusi per i plugin che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione vs aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o un pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per aggiornamenti di routine di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale aggiornamento, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono i metadati della fonte marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Permette all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` dei plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle Skills gestite dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione delle Skills da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti di hook e spec npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **solo registry** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite a livello di progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Le specifiche di pacchetto semplici vengono installate direttamente da npm anche durante la transizione del lancio.

    Le specifiche semplici e `@latest` restano sul canale stabile. Le versioni correttive datate di OpenClaw come `2026.5.3-1` sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si arresta e ti chiede di aderire esplicitamente con un tag di prerelease come `@beta`/`@rc` o una versione di prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione semplice corrisponde a un id ufficiale di Plugin (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica con scope esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. I formati supportati includono URL di clonazione `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno il checkout del ref richiesto quando presente, quindi usano il normale installer della directory del Plugin. Questo significa che la validazione del manifest, la scansione del codice pericoloso, il lavoro di installazione del package manager e i record di installazione si comportano come le installazioni npm. Le installazioni git registrate includono l'URL/ref sorgente più il commit risolto, così `openclaw plugins update` può risolvere nuovamente la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come i metodi Gateway e i comandi CLI. Se il Plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi Plugin nativi di OpenClaw devono contenere un `openclaw.plugin.json` valido nella root del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace di Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le specifiche Plugin semplici sicure per npm vengono installate da npm per impostazione predefinita durante la transizione del lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla la compatibilità pubblicizzata dell'API del Plugin / Gateway minimo prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` versionato npm-pack, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso degli archivi. Le versioni ClawHub più vecchie senza metadati ClawPack vengono ancora installate tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati della loro sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati di digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire release ClawHub più recenti; i selettori di versione o tag espliciti come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano fissati a quel selettore.

#### Abbreviazione del marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registry locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente la sorgente del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice di marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono rimanere all'interno del repository marketplace clonato. OpenClaw accetta sorgenti con percorsi relativi da quel repository e rifiuta sorgenti di plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per i percorsi e gli archivi locali, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarati dal manifest, command-skills Cursor e directory hook compatibili con Codex; le altre funzionalità rilevate dei bundle sono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Passa dalla vista tabellare a righe di dettaglio per plugin con metadati di sorgente/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile dalla macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, criteri degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o nuovi hook vengano eseguiti. Per distribuzioni remote/container, verifica di riavviare il processo figlio effettivo `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ciascun plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se quei nomi di pacchetto
sono presenti lungo il normale percorso di ricerca Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un gestore di pacchetti e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime del plugin. I risultati di ricerca includono nome del pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per il lavoro sui plugin in bundle all'interno di un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay della sorgente montata
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, quindi le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per ripulire lo stato di dipendenze legacy o installare plugin scaricabili configurati mancanti.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e salute RPC.
- Gli hook di conversazione non in bundle (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` sulle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo non vincolato il comportamento predefinito.
</Note>

### Indice dei plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest di plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro dei plugin a freddo.

Quando OpenClaw vede record legacy distribuiti `plugins.installs` nella configurazione, li sposta nell'indice dei plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record dei plugin da `plugins.entries`, dall'indice persistente dei plugin, dalle voci dell'elenco di consenso/diniego dei plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni plugin di OpenClaw. Per i plugin di Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni di plugin tracciate nell'indice dei plugin gestiti e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Quando passi un id plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Questo significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte fissate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto verso il record del plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso verso il record del plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` riutilizza la specifica del plugin tracciato a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record di plugin npm e ClawHub sulla linea predefinita provano prima `@beta`, poi ripiegano sulla specifica predefinita/latest registrata se non esiste alcuna release beta del plugin. Versioni esatte e tag espliciti restano fissati a quel selettore.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Prima di un aggiornamento npm live, OpenClaw verifica la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash attesi e reali e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca un criterio di continuazione esplicito.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione del codice pericoloso integrata durante gli aggiornamenti dei plugin. Continua a non bypassare i blocchi dei criteri `before_install` del plugin o i blocchi per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, funzionalità del manifest, flag dei criteri, diagnostica, metadati di installazione, funzionalità dei bundle e qualsiasi supporto server MCP o LSP rilevato senza importare per impostazione predefinita il runtime del plugin. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi, servizi, metodi gateway e route HTTP registrati. L'ispezione runtime segnala direttamente dipendenze plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai plugin sono installati come gruppi di comandi root `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; ad esempio un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di funzionalità (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di funzionalità (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna funzionalità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna funzionalità

Vedi [Forme dei plugin](/it/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello di funzionalità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a scripting e audit. `inspect --all` renderizza una tabella su tutta la flotta con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità dei bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza del percorso del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, come proprietà del percorso o permessi scrivibili da tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per fallimenti della forma del modulo come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistente di OpenClaw per identità dei plugin, abilitazione, metadati di sorgente e proprietà dei contributi. Avvio normale, ricerca del proprietario del provider, classificazione della configurazione del canale e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per verificare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice dei plugin persistente, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione a runtime.

`openclaw doctor --fix` ripara anche i disallineamenti npm gestiti adiacenti al registro: se un package `@openclaw/*` orfano o recuperato sotto la radice npm dei plugin gestiti oscura un plugin incluso, doctor rimuove quel package obsoleto e ricostruisce il registro in modo che l'avvio venga validato rispetto al manifest incluso.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il ripristino di emergenza dell'avvio durante la distribuzione della migrazione.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco Marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repo GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta più il manifest marketplace analizzato e le voci dei plugin.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
