---
read_when:
    - Vuoi installare o gestire i Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-10T19:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci i plugin Gateway, i pacchetti hook e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per l'utente finale per installare, abilitare e risolvere i problemi dei plugin.
  </Card>
  <Card title="Gestire i plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installare, elencare, aggiornare, disinstallare e pubblicare.
  </Card>
  <Card title="Bundle di plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest del Plugin" href="/it/plugins/manifest">
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

Per indagare su installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi su stderr e mantiene l'output JSON analizzabile. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei plugin sono disabilitati. Usa invece la sorgente Nix per questa installazione al posto di `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
I plugin inclusi vengono forniti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I plugin OpenClaw nativi devono fornire `openclaw.plugin.json` con uno JSON Schema inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le funzionalità del bundle rilevate.
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

I manutentori che testano installazioni in fase di configurazione possono sovrascrivere le sorgenti di installazione automatica dei plugin con variabili d'ambiente protette. Vedi [override dell'installazione dei Plugin](/it/plugins/install-overrides).

<Warning>
Durante il passaggio di lancio, i nomi di pacchetto senza prefisso vengono installati da npm per impostazione predefinita. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei plugin come esecuzione di codice. Preferisci versioni bloccate.
</Warning>

`plugins search` interroga ClawHub per pacchetti plugin installabili e stampa nomi di pacchetto pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin, non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm rimane un fallback supportato e un percorso di installazione diretta. I pacchetti plugin `@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; consulta l'elenco attuale su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'[inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`. Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include della configurazione e riparazione di configurazioni non valide">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Include radice, array di include e include con override fratelli falliscono in modo chiuso invece di appiattirsi. Vedi [include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di ripristino per plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza il target di installazione esistente e sovrascrive sul posto un plugin o un pacchetto hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente bloccata. Non è supportato con `--marketplace`, perché le installazioni da marketplace mantengono i metadati della sorgente marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi di policy degli hook `before_install` dei plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle skill supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di skill da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/clawhub/security).

  </Accordion>
  <Accordion title="Pacchetti hook e spec npm">
    `plugins install` è anche la superficie di installazione per i pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione del pacchetto.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Le spec Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni npm globali per l'installazione. Le radici npm dei plugin gestiti ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze plugin issate.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Durante il passaggio di lancio, anche le spec di pacchetto senza prefisso vengono installate direttamente da npm.

    Le spec senza prefisso e `@latest` restano sul canale stabile. Le versioni correttive OpenClaw con data, come `2026.5.3-1`, sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione senza prefisso corrisponde a un id plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce di catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec con scope esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clone completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno checkout del ref richiesto quando presente, poi usano il normale installer della directory plugin. Questo significa che la validazione del manifest, la scansione del codice pericoloso, il lavoro di installazione del package manager e i record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l'URL/ref sorgente più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime, come metodi gateway e comandi CLI. Se il plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella radice del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi testare lo stesso percorso di installazione npm-root gestito usato dalle installazioni da registro, inclusi la verifica di `package-lock.json`, la scansione delle dipendenze issate e i record di installazione npm. I percorsi archivio semplici continuano a installarsi come archivi locali sotto la radice delle estensioni plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Durante il passaggio di lancio, le spec plugin sicure per npm senza prefisso vengono installate da npm per impostazione predefinita:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla la compatibilità dichiarata dell'API Plugin / minima del Gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso di archivio. Le versioni precedenti di ClawHub senza metadati ClawPack continuano a essere installate tramite il percorso di verifica dell'archivio del pacchetto legacy. Le installazioni registrate conservano i metadati della sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione conservano una specifica registrata senza versione in modo che `openclaw plugins update` possa seguire le release ClawHub più recenti; i selettori espliciti di versione o tag, come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, restano bloccati su quel selettore.

#### Scorciatoia del marketplace

Usa la scorciatoia `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Sorgenti marketplace">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice marketplace locale o un percorso `marketplace.json`
    - una scorciatoia di repository GitHub, come `owner/repo`
    - un URL di repository GitHub, come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci Plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repository e rifiuta sorgenti Plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi e archivi locali, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skill Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarate dal manifest, command-skill Cursor e directory hook Codex compatibili; altre capacità dei bundle rilevate sono mostrate in diagnostica/info, ma non sono ancora collegate all'esecuzione runtime.
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
  Passa dalla vista tabellare a righe di dettaglio per Plugin con metadati di sorgente/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile dalla macchina più diagnostica del registro e stato di installazione delle dipendenze dei pacchetti.
</ParamField>

<Note>
`plugins list` legge prima il registro Plugin locale persistito, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per controllare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice Plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione di nuovo codice `register(api)` o di hook. Per distribuzioni remote/container, verifica di riavviare il processo figlio `openclaw gateway run` effettivo, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni Plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw controlla se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del Plugin; non
importa codice runtime del Plugin, non esegue un package manager e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo stato
locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime Plugin. I
risultati di ricerca includono nome pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare su Plugin inclusi in un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay della sorgente montata
prima di `/app/dist/extensions/synology-chat`; una directory sorgente semplicemente copiata
resta inerte, quindi le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per ripulire lo stato delle dipendenze legacy o recuperare Plugin scaricabili mancanti a cui fa riferimento la configurazione.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, gli indizi su servizio/processo, il percorso della configurazione e lo stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei Plugin gestiti mantenendo non bloccato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest Plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dai manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e dal registro Plugin a freddo.

Quando OpenClaw vede record `plugins.installs` legacy distribuiti nella configurazione, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Scritture esplicite dei Plugin e `openclaw doctor --fix` spostano quei record nell'indice dei Plugin e rimuovono la chiave di configurazione quando le scritture di configurazione sono consentite; se una delle scritture fallisce, i record di configurazione vengono conservati così che i metadati di installazione non vadano persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, dall'indice Plugin persistito, dalle voci degli elenchi allow/deny dei Plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` non sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i Plugin di memoria attiva, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni Plugin tracciate nell'indice dei Plugin gestiti e alle installazioni hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id Plugin e specifica npm">
    Quando passi un id Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel Plugin. Ciò significa che dist-tag memorizzati in precedenza, come `@beta`, e versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome pacchetto di nuovo nel record Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve comunque di nuovo nel record Plugin tracciato. Usalo quando un Plugin era bloccato su una versione esatta e vuoi riportarlo alla linea di release predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la specifica Plugin tracciata a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica default/latest registrata se non esiste alcuna release beta del Plugin. Versioni esatte e tag espliciti restano bloccati su quel selettore.

  </Accordion>
  <Accordion title="Controlli versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante l'aggiornamento">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione del codice pericoloso integrata durante gli aggiornamenti dei Plugin. Continua a non bypassare i blocchi di policy `before_install` dei Plugin né il blocco per errore di scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, capacità del manifest, flag di policy, diagnostica, metadati di installazione, capacità del bundle e qualsiasi supporto rilevato per server MCP o LSP senza importare per impostazione predefinita il runtime del Plugin. Aggiungi `--runtime` per caricare il modulo Plugin e includere hook, strumenti, comandi, servizi, metodi gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà dei Plugin sono solitamente installati come gruppi di comandi root `openclaw`, ma i Plugin possono anche registrare comandi annidati sotto un parent core come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo nel percorso indicato; per esempio, un Plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un solo tipo di capacità (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Consulta [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello di capacità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina, adatto per scripting e audit. `inspect --all` mostra una tabella estesa all'intera flotta con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica del manifest/discovery e avvisi di compatibilità. Quando è tutto pulito, stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la convalida della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, ad esempio proprietà del percorso o permessi scrivibili da tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere nell'output diagnostico un riepilogo compatto della forma delle esportazioni.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistito di OpenClaw per identità dei plugin installati, abilitazione, metadati della sorgente e proprietà dei contributi. L'avvio normale, la ricerca del proprietario del provider, la classificazione della configurazione dei canali e l'inventario dei plugin possono leggerlo senza importare i moduli runtime dei plugin.

Usa `plugins registry` per verificare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistito dei plugin, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registro: se un package `@openclaw/*` orfano o recuperato sotto la radice npm gestita dei plugin oscura un plugin in bundle, doctor rimuove quel package obsoleto e ricostruisce il registro, così l'avvio viene convalidato rispetto al manifest in bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un selettore di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il ripristino di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del Marketplace accetta un percorso locale del Marketplace, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta più il manifest del Marketplace analizzato e le voci dei plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [ClawHub](/it/clawhub)
