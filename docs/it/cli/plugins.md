---
read_when:
    - Vuoi installare o gestire plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T01:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Gestire i plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifesto del Plugin" href="/it/plugins/manifest">
    Campi del manifesto e schema di configurazione.
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
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifesti di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
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
I nomi di pacchetto semplici installano da npm per impostazione predefinita durante la transizione di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti plugin installabili e stampa nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin, non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm rimane un fallback supportato e un percorso di installazione diretta. I pacchetti plugin `@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; vedi l'elenco corrente su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'[inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`. Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione di configurazioni non valide">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Include radice, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce plugin non valida. L'unica eccezione documentata al momento dell'installazione è un percorso di recupero ristretto per plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale aggiornamento, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono metadati della sorgente marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner di codice pericoloso integrato. Permette all'installazione di proseguire anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` del plugin e **non** aggira i fallimenti di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni delle dipendenze delle Skills basate su Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione delle Skills da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti di hook e spec npm">
    `plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per hook, non per l'installazione di pacchetti.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Le spec Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la shell ha impostazioni globali di installazione npm. Le radici npm dei plugin gestiti ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze dei plugin hoistate.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetto semplici installano direttamente da npm durante la transizione di lancio.

    Le spec semplici e `@latest` rimangono sul canale stabile. Le versioni di correzione legacy di OpenClaw come `2026.5.3-1` sono ancora trattate come release stabili per questo controllo, così i pacchetti più vecchi continuano ad aggiornarsi in sicurezza. Il nuovo lavoro sulla linea di supporto mensile è pianificato per usare normali numeri di patch SemVer invece di suffissi di correzione con trattino. Se npm risolve una spec della linea predefinita a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione semplice corrisponde a un id plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec con ambito esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clone completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per eseguire il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, eseguono il checkout del ref richiesto quando presente, poi usano il normale installer della directory del plugin. Questo significa che convalida del manifesto, scansione del codice pericoloso, lavoro di installazione del package manager e record di installazione si comportano come le installazioni npm. Le installazioni git registrate includono l'URL/ref sorgente più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare registrazioni runtime come metodi gateway e comandi CLI. Se il plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella radice del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi testare lo stesso percorso di installazione con radice npm gestita usato dalle installazioni da registro, inclusi verifica di `package-lock.json`, scansione delle dipendenze hoistate e record di installazione npm. I percorsi di archivio semplici si installano comunque come archivi locali sotto la radice delle estensioni plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec plugin semplici sicure per npm installano da npm per impostazione predefinita durante la transizione di lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica l'API Plugin pubblicizzata / la compatibilità minima del Gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa attraverso il normale percorso di archivio. Le versioni ClawHub più vecchie senza metadati ClawPack vengono ancora installate tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati della sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i fatti sul digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire le release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano vincolati a quel selettore.

#### Abbreviazione marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
    - un'abbreviazione repo GitHub come `owner/repo`
    - un URL repo GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repo marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repo e rifiuta sorgenti plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti plugin non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Attualmente sono supportati Skills dei bundle, command-skills Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarate nel manifest, command-skills Cursor e directory hook Codex compatibili; le altre capacità dei bundle rilevate vengono mostrate in diagnostics/info ma non sono ancora collegate all'esecuzione runtime.
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
`plugins list` legge prima il registro dei plugin locale persistito, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione di avvio a freddo, ma non è un probe runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, policy hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o gli hook vengano eseguiti. Per distribuzioni remote/container, verifica di riavviare il vero figlio `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un package manager e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo
stato locale, non modifica la config, non installa pacchetti e non carica codice
runtime del plugin. I risultati della ricerca includono il nome del pacchetto
ClawHub, famiglia, canale, versione, riepilogo e un suggerimento di installazione
come `openclaw plugins install clawhub:<package>`.

Per lavoro su plugin in bundle dentro un'immagine Docker pacchettizzata, monta con bind la
directory sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una directory sorgente copiata
normalmente resta inerte, quindi le normali installazioni pacchettizzate usano ancora il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o recuperare plugin scaricabili mancanti referenziati dalla config.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, indicazioni su servizio/processo, percorso config e salute RPC.
- Gli hook di conversazione non in bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riusano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` sulle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo non vincolato il comportamento predefinito.
</Note>

### Indice dei plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non config utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dai manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro plugin a freddo.

Quando OpenClaw vede record legacy forniti `plugins.installs` nella config, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Scritture esplicite dei plugin e `openclaw doctor --fix` spostano quei record nell'indice dei plugin e rimuovono la chiave config quando le scritture della config sono consentite; se una delle due scritture fallisce, i record della config vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del plugin da `plugins.entries`, dall'indice dei plugin persistito, dalle voci allow/deny list dei plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni plugin di OpenClaw. Per i plugin Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

<Note>
`--keep-config` è supportato come alias deprecato per `--keep-files`.
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
  <Accordion title="Risoluzione tra id plugin e specifica npm">
    Quando passi un id plugin, OpenClaw riusa la specifica di installazione registrata per quel plugin. Ciò significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte vincolate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record del plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati sull'id.

    Passare il nome del pacchetto npm senza versione o tag risolve anche al record del plugin tracciato. Usa questo quando un plugin era vincolato a una versione esatta e vuoi riportarlo alla linea di release predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riusa la specifica del plugin tracciata a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica predefinita/latest registrata se non esiste una release beta del plugin. Versioni esatte e tag espliciti restano vincolati a quel selettore.

    OpenClaw non espone ancora canali plugin di supporto LTS o mensili. Il lavoro pianificato sulle linee di supporto richiederà che pacchetti plugin e tag ClawHub seguano la stessa linea di supporto del pacchetto core.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw confronta la versione del pacchetto installato con i metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso e effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione del codice pericoloso integrata durante gli aggiornamenti dei plugin. Non aggira comunque i blocchi policy `before_install` del plugin o i blocchi per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, capacità del manifest, flag policy, diagnostica, metadati di installazione, capacità del bundle ed eventuale supporto server MCP o LSP rilevato senza importare di default il runtime del plugin. Aggiungi `--runtime` per caricare il modulo plugin e includere hook, strumenti, comandi, servizi, metodi gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà dei plugin sono installati come gruppi di comandi root `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; ad esempio un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capacità (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Consulta [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori dettagli sul modello delle capacità.

<Note>
Il flag `--json` produce un report leggibile da macchina, adatto per scripting e audit. `inspect --all` mostra una tabella estesa a tutta la flotta con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito, stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente relativa al plugin bloccato, ad esempio proprietà del percorso o permessi scrivibili da chiunque, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registry locale dei plugin è il modello persistito di lettura a freddo di OpenClaw per identità dei plugin installati, abilitazione, metadati di origine e proprietà dei contributi. Avvio normale, ricerca del proprietario del provider, classificazione della configurazione del canale e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per verificare se il registry persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistito dei plugin, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registry: se un pacchetto `@openclaw/*` orfano o recuperato sotto la root npm gestita dei plugin mette in ombra un plugin incluso, doctor rimuove quel pacchetto obsoleto e ricostruisce il registry, così l'avvio valida rispetto al manifest incluso.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità break-glass deprecato per errori di lettura del registry. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il recupero di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco Marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta di origine risolta più il manifest marketplace analizzato e le voci dei plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
