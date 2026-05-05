---
read_when:
    - Vuoi installare o gestire plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-05T01:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali per installare, abilitare e risolvere i problemi dei Plugin.
  </Card>
  <Card title="Gestisci Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle Plugin" href="/it/plugins/bundles">
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

Per analizzare installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene l'output JSON analizzabile. Consulta [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I Plugin in bundle vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio provider di modelli in bundle, provider vocali in bundle e il Plugin browser in bundle); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con un JSON Schema inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins search "calendar"                   # cerca Plugin ClawHub
openclaw plugins install <package>                      # npm per impostazione predefinita
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install npm:<package>                  # solo npm
openclaw plugins install git:github.com/<owner>/<repo>  # repository git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # sovrascrivi l'installazione esistente
openclaw plugins install <package> --pin                # blocca la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
I nomi di pacchetto senza prefisso vengono installati da npm per impostazione predefinita durante la transizione di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni bloccate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetto pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti Plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; consulta l'elenco corrente
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando tale tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include della configurazione e riparazione della configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Include radice, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Consulta [Include della configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, la configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L'unica eccezione documentata al momento dell'installazione è un percorso ristretto di ripristino per Plugin in bundle che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riusa la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto hook già installato. Usalo quando intendi reinstallare deliberatamente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per aggiornamenti di routine di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte bloccata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono i metadati della fonte marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Permette all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` dei Plugin e **non** aggira gli errori di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze delle Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di Skills ClawHub.

    Se un Plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti hook e spec npm">
    `plugins install` è anche la superficie di installazione per pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per hook, non per l'installazione del pacchetto.

    Le spec npm sono **solo registro** (nome del pacchetto + **versione esatta** facoltativa o **dist-tag**). Le spec Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni di dipendenze vengono eseguite a livello di progetto con `--ignore-scripts` per sicurezza, anche quando la shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetto senza prefisso vengono installate direttamente da npm durante la transizione di lancio.

    Le spec senza prefisso e `@latest` restano sul canale stabile. Le versioni correttive OpenClaw con data, come `2026.5.3-1`, sono rilasci stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione senza prefisso corrisponde a un id Plugin ufficiale (ad esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec con scope esplicito (ad esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clone completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno checkout del ref richiesto quando presente, poi usano il normale installer della directory Plugin. Ciò significa che convalida del manifest, scansione di codice pericoloso, lavoro di installazione del package manager e record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono URL/ref della fonte più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la fonte in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi gateway e comandi CLI. Se il Plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, ad esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella radice del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva record di installazione.

    Sono supportate anche le installazioni marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec Plugin compatibili con npm senza prefisso vengono installate da npm per impostazione predefinita durante la transizione di lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla l'API Plugin pubblicizzata / compatibilità minima del gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header del digest ClawHub e il digest dell'artefatto, poi lo installa tramite il normale percorso degli archivi. Le versioni ClawHub meno recenti senza metadati ClawPack si installano ancora tramite il percorso legacy di verifica degli archivi dei pacchetti. Le installazioni registrate mantengono i metadati della fonte ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una spec registrata senza versione, così `openclaw plugins update` può seguire rilasci ClawHub più recenti; selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano bloccati a quel selettore.

#### Abbreviazione marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Sorgenti del marketplace">
    - un nome di marketplace conosciuto da Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice di marketplace locale o un percorso `marketplace.json`
    - una forma abbreviata di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repository del marketplace clonato. OpenClaw accetta sorgenti con percorsi relativi da quel repository e rifiuta sorgenti di plugin HTTP(S), con percorsi assoluti, git, GitHub e altre sorgenti non basate su percorsi dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi e archivi locali, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarate dal manifest, command-skills Cursor e directory di hook Codex compatibili; le altre funzionalità dei bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Inventario leggibile da macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per controllare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver cambiato codice del plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o gli hook vengano eseguiti. Per distribuzioni remote/container, verifica di riavviare il figlio effettivo `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw controlla se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un gestore di pacchetti e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime del plugin. I risultati della ricerca includono il nome pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare sui plugin inclusi dentro un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o recuperare plugin scaricabili mancanti che sono referenziati dalla configurazione.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e salute RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo non bloccato il comportamento predefinito.
</Note>

### Indice dei plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non configurazione utente. Le installazioni e gli aggiornamenti lo scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest di plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e dal registro a freddo dei plugin.

Quando OpenClaw vede record legacy distribuiti `plugins.installs` nella configurazione, li sposta nell'indice dei plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del plugin da `plugins.entries`, dall'indice persistente dei plugin, dalle voci dell'elenco allow/deny dei plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` non sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni plugin di OpenClaw. Per i plugin Active Memory, lo slot di memoria viene reimpostato a `memory-core`.

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
  <Accordion title="Risoluzione di id plugin rispetto a specifica npm">
    Quando passi un id plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Questo significa che dist-tag salvati in precedenza come `@beta` e versioni esatte bloccate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto al record del plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Anche passare il nome pacchetto npm senza versione o tag viene risolto al record del plugin tracciato. Usalo quando un plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la specifica del plugin tracciato a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record di plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ricadono sulla specifica predefinita/latest registrata se non esiste alcun rilascio beta del plugin. Versioni esatte e tag espliciti restano bloccati a quel selettore.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità salvato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono chiusi a meno che il chiamante non fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione integrata del codice pericoloso durante gli aggiornamenti dei plugin. Continua a non bypassare i blocchi di policy `before_install` dei plugin o il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, funzionalità del manifest, flag di policy, diagnostica, metadati di installazione, funzionalità del bundle e qualsiasi supporto server MCP o LSP rilevato senza importare per impostazione predefinita il runtime del plugin. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi, servizi, metodi gateway e rotte HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze mancanti del plugin; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti da plugin sono installati come gruppi di comando radice `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio, un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di funzionalità (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di funzionalità (ad es. testo + parlato + immagini)
- **hook-only** — solo hook, nessuna funzionalità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna funzionalità

Vedi [Forme dei plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello delle funzionalità.

<Note>
Il flag `--json` produce un report leggibile da macchina adatto a scripting e audit. `inspect --all` rende una tabella a livello di flotta con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, come proprietà del percorso o permessi scrivibili da tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per fallimenti di forma del modulo come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistente di OpenClaw per identità dei plugin installati, abilitazione, metadati di sorgente e proprietà dei contributi. Avvio normale, lookup del proprietario del provider, classificazione della configurazione del canale e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per controllare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice dei plugin persistito, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

Anche `openclaw doctor --fix` ripara la deriva npm gestita adiacente al registro: se un pacchetto `@openclaw/*` orfano o recuperato sotto la radice npm dei plugin gestiti oscura un plugin in bundle, doctor rimuove quel pacchetto obsoleto e ricostruisce il registro, così l'avvio convalida rispetto al manifest in bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità break-glass deprecato per gli errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il ripristino di emergenza dell'avvio durante il rollout della migrazione.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del marketplace accetta un percorso di marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta più il manifest del marketplace analizzato e le voci dei plugin.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
