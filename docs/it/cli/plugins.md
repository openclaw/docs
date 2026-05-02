---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-02T08:19:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci i Plugin del Gateway, i pacchetti hook e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali all’installazione, all’abilitazione e alla risoluzione dei problemi dei Plugin.
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
su stderr e mantiene analizzabile l’output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin nativi OpenClaw devono distribuire `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L’output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
I nomi di pacchetto non qualificati vengono controllati prima in ClawHub, poi in npm. Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetto pronti per l’installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. Durante la migrazione a
ClawHub, OpenClaw distribuisce ancora alcuni pacchetti Plugin `@openclaw/*` di proprietà OpenClaw
su npm; quelle versioni dei pacchetti possono restare indietro rispetto al sorgente incluso tra i cicli di rilascio dei Plugin. Se npm segnala un pacchetto Plugin di proprietà OpenClaw come deprecato, quella
versione pubblicata è un vecchio artefatto esterno; usa il Plugin incluso con
l’OpenClaw corrente o un checkout locale finché non viene pubblicato un pacchetto npm più recente.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e ripristino da configurazione non valida">
    Se la sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Gli include root, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l’installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l’avvio del Gateway, una configurazione non valida per un Plugin viene isolata a quel Plugin, così altri canali e Plugin possono continuare a funzionare; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L’unica eccezione documentata in fase di installazione è un percorso ristretto di ripristino dei Plugin inclusi per i Plugin che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli upgrade ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale upgrade, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l’installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace mantengono i metadati della fonte marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un’opzione di emergenza per falsi positivi nello scanner integrato del codice pericoloso. Consente all’installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` del Plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni delle dipendenze delle skill supportate dal Gateway usano l’override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione delle skill ClawHub.

    Se un Plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l’abilitazione per singolo hook, non per l’installazione dei pacchetti.

    Le specifiche npm sono **solo registro** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi saltare la ricerca in ClawHub e installare direttamente da npm. Le specifiche di pacchetto non qualificate preferiscono comunque ClawHub e ricorrono a npm solo quando ClawHub non ha quel pacchetto o quella versione.

    Le specifiche non qualificate e `@latest` restano sul canale stabile. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione non qualificata corrisponde a un id Plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica con ambito esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono URL di clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per estrarre un branch, tag o commit prima dell’installazione.

    Le installazioni Git clonano in una directory temporanea, estraggono il ref richiesto quando presente, poi usano il normale programma di installazione della directory Plugin. Questo significa che la validazione del manifest, la scansione del codice pericoloso, il lavoro di installazione del package manager e i record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l’URL/ref di origine più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la fonte in seguito.

    Dopo l’installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi Gateway e comandi CLI. Se il Plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di Plugin nativi OpenClaw devono contenere un `openclaw.plugin.json` valido nella root del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per specifiche Plugin compatibili con npm non qualificate. Ricorre a npm solo se ClawHub non ha quel pacchetto o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per forzare la risoluzione solo npm, per esempio quando ClawHub non è raggiungibile o sai che il pacchetto esiste solo su npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla la compatibilità dichiarata dell’API del Plugin / minima del gateway prima dell’installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il ClawPack versionato, verifica l’header digest di ClawHub e il digest dell’artefatto, quindi lo installa tramite il normale percorso archivio. Le versioni ClawHub più vecchie senza metadati ClawPack vengono ancora installate tramite il percorso legacy di verifica dell’archivio del pacchetto. Le installazioni registrate mantengono i metadati della fonte ClawHub e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano fissati a quel selettore.

#### Abbreviazione marketplace

Usa l’abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente la fonte marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Origini marketplace">
    - un nome marketplace noto di Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole dei marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei Plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta origini con percorso relativo da quel repository e rifiuta origini Plugin HTTP(S), con percorso assoluto, git, GitHub e altre origini non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi e archivi locali, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso list/info/enable/disable. Al momento sono supportati Skills dei bundle, command-skills di Claude, valori predefiniti di `settings.json` di Claude, valori predefiniti di `.lsp.json` di Claude / `lspServers` dichiarati dal manifest, command-skills di Cursor e directory hook compatibili con Codex; le altre capacità dei bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Mostra solo i Plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per Plugin con metadati di origine/provenienza/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile dalla macchina più diagnostica del registro.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistito dei Plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per controllare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del Plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o hook vengano eseguiti. Per distribuzioni remote/container, verifica di riavviare il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti né carica codice runtime dei Plugin. I risultati di ricerca includono il nome del pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare su Plugin inclusi in un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, per esempio
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, quindi le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per ripulire lo stato legacy delle dipendenze o installare Plugin scaricabili configurati mancanti.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e salute RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei Plugin gestiti mantenendo non bloccato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la fonte durevole dei metadati di installazione, inclusi record per manifest di Plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e dal registro a freddo dei Plugin.

Quando OpenClaw vede record legacy forniti `plugins.installs` nella configurazione, li sposta nell'indice dei Plugin e rimuove la chiave di configurazione; se una delle due scritture non riesce, i record di configurazione vengono conservati per non perdere i metadati di installazione.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record dei Plugin da `plugins.entries`, dall'indice dei Plugin persistito, dalle voci degli elenchi allow/deny dei Plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i Plugin di memoria attiva, lo slot di memoria viene reimpostato su `memory-core`.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni di Plugin tracciate nell'indice dei Plugin gestiti e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione di id Plugin e specifica npm">
    Quando passi un id Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel Plugin. Ciò significa che dist-tag archiviati in precedenza come `@beta` e versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome pacchetto riportandolo al record del Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag viene risolto anch'esso al record del Plugin tracciato. Usalo quando un Plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Controlli di versione e deriva di integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità archiviato e l'hash dell'artefatto recuperato cambia, OpenClaw tratta la cosa come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install in update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione dangerous-code integrata durante gli aggiornamenti dei Plugin. Continua a non bypassare i blocchi di policy `before_install` dei Plugin né il blocco per errori di scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, origine, capacità del manifest, flag di policy, diagnostica, metadati di installazione, capacità del bundle e qualsiasi supporto server MCP o LSP rilevato senza importare il runtime del Plugin per impostazione predefinita. Aggiungi `--runtime` per caricare il modulo Plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai Plugin vengono installati come gruppi di comandi radice `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio un Plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capacità (per esempio un Plugin solo provider)
- **hybrid-capability** — più tipi di capacità (per esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello delle capacità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a script e audit. `inspect --all` renderizza una tabella a livello di flotta con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità dei bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando è tutto pulito stampa `No plugin issues detected.`

Per errori di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere nell'output diagnostico un riepilogo compatto della forma degli export.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei Plugin è il modello di lettura a freddo persistito di OpenClaw per identità dei Plugin installati, abilitazione, metadati di origine e proprietà dei contributi. Avvio normale, ricerca del proprietario provider, classificazione della configurazione dei canali e inventario dei Plugin possono leggerlo senza importare moduli runtime dei Plugin.

Usa `plugins registry` per ispezionare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistito dei Plugin, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità di emergenza deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il recupero di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, un'abbreviazione GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta dell'origine risolta più il manifest marketplace analizzato e le voci dei Plugin.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
