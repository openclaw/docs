---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-07T13:15:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci i Plugin del Gateway, gli hook pack e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per gli utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Gestire i Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installare, elencare, aggiornare, disinstallare e pubblicare.
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

Per analizzare installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
In modalità Nix (`OPENCLAW_NIX_MODE=1`), i mutatori del ciclo di vita dei Plugin sono disabilitati. Usa la sorgente Nix per questa installazione invece di `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` o `plugins disable`; per nix-openclaw, usa la [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) agent-first.
</Note>

<Note>
I Plugin in bundle vengono forniti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli in bundle, i provider vocali in bundle e il Plugin browser in bundle); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

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
Durante il passaggio di lancio, i nomi di pacchetto senza prefisso installano da npm per impostazione predefinita. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come esecuzione di codice. Preferisci versioni con pin.
</Warning>

`plugins search` interroga ClawHub per pacchetti di Plugin installabili e stampa
nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti di Plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; consulta l'elenco attuale
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include della configurazione e riparazione della configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` intatto. Gli include radice, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include della configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione di Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce di Plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di recupero per Plugin in bundle che scelgono esplicitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riusa il target di installazione esistente e sovrascrive sul posto un Plugin o hook pack già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id di Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una sorgente con pin. Non è supportato con `--marketplace`, perché le installazioni da marketplace mantengono i metadati della sorgente marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner di codice pericoloso integrato. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` del Plugin e **non** aggira gli errori di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze delle skill supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di Skills da ClawHub.

    Se un Plugin che hai pubblicato su ClawHub è bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Hook pack e specifiche npm">
    `plugins install` è anche la superficie di installazione per gli hook pack che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **solo registro** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm. Le radici npm dei Plugin gestiti ereditano gli `overrides` npm a livello di pacchetto di OpenClaw, quindi i pin di sicurezza dell'host si applicano anche alle dipendenze dei Plugin hoistate.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le specifiche di pacchetto senza prefisso installano direttamente da npm durante il passaggio di lancio.

    Le specifiche senza prefisso e `@latest` restano sul canale stabile. Le versioni di correzione OpenClaw con data, come `2026.5.3-1`, sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione senza prefisso corrisponde a un id di Plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una specifica con ambito esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL completi `https://`, `ssh://`, `git://`, `file://` e URL di clone `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, eseguono il checkout del ref richiesto quando presente, quindi usano il normale installatore di directory dei Plugin. Ciò significa che la validazione del manifest, la scansione del codice pericoloso, il lavoro di installazione del package manager e i record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l'URL/ref sorgente più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la sorgente in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come i metodi del Gateway e i comandi CLI. Se il Plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido alla radice del Plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi
    testare lo stesso percorso di installazione npm-root gestito usato dalle installazioni da registro,
    inclusi la verifica di `package-lock.json`, la scansione delle dipendenze hoistate e
    i record di installazione npm. I percorsi di archivio semplici vengono comunque installati come archivi locali
    sotto la radice delle estensioni dei Plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Durante il passaggio di lancio, le specifiche di Plugin sicure per npm senza prefisso installano da npm per impostazione predefinita:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla l'API Plugin pubblicizzata / la compatibilità minima del Gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` versionato npm-pack, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso di archivio. Le versioni ClawHub più vecchie senza metadati ClawPack vengono comunque installate tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate mantengono i metadati della sorgente ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati di digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire le release ClawHub più recenti; i selettori espliciti di versione o tag, come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta`, restano bloccati su quel selettore.

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
  <Tab title="Sorgenti del marketplace">
    - un nome marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repo GitHub come `owner/repo`
    - un URL di repo GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repo marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repo e rifiuta sorgenti Plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti Plugin non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi e archivi locali, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills del bundle, command-skills di Claude, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` / `lspServers` dichiarati nel manifest, command-skills di Cursor e directory hook Codex compatibili; altre capacità del bundle rilevate vengono mostrate in diagnostica/info, ma non sono ancora collegate all'esecuzione runtime.
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
  Inventario leggibile da macchina più diagnostica del registro e stato di installazione delle dipendenze dei pacchetti.
</ParamField>

<Note>
`plugins list` legge prima il registro Plugin locale persistito, con fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per controllare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una verifica runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice Plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o hook vengano eseguiti. Per distribuzioni remote/container, verifica di star riavviando il figlio effettivo `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw controlla se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del plugin; non
importa codice runtime del plugin, non esegue un package manager e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca remota nel catalogo ClawHub. Non ispeziona lo stato
locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime Plugin. I risultati di ricerca includono il nome del pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare su Plugin in bundle all'interno di un'immagine Docker pacchettizzata, monta in bind la directory sorgente del plugin
sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay di sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o recuperare plugin scaricabili mancanti che sono referenziati dalla configurazione.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e salute RPC.
- Gli hook di conversazione non in bundle (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra un target di installazione gestito.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice Plugin gestito mantenendo il comportamento predefinito non bloccato.
</Note>

### Indice Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest Plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro Plugin a freddo.

Quando OpenClaw trova record legacy `plugins.installs` forniti nella configurazione, le letture runtime li trattano come input di compatibilità senza riscrivere `openclaw.json`. Scritture Plugin esplicite e `openclaw doctor --fix` spostano quei record nell'indice Plugin e rimuovono la chiave di configurazione quando le scritture di configurazione sono consentite; se una delle due scritture fallisce, i record di configurazione vengono conservati così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, dall'indice Plugin persistito, dalle voci delle liste allow/deny dei Plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i plugin Active Memory, lo slot di memoria viene reimpostato a `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni Plugin tracciate nell'indice Plugin gestito e alle installazioni hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id Plugin e specifica npm">
    Quando passi un id Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Ciò significa che i dist-tag memorizzati in precedenza, come `@beta`, e le versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica di pacchetto npm esplicita con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record Plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza una versione o un tag risolve anch'esso verso il record Plugin tracciato. Usalo quando un plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di release predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la specifica Plugin tracciata a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica default/latest registrata se non esiste alcuna release beta del plugin. Versioni esatte e tag espliciti restano bloccati su quel selettore.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy esplicita di continuazione.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install in update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione di codice pericoloso integrata durante gli aggiornamenti Plugin. Continua a non bypassare i blocchi di policy Plugin `before_install` o i blocchi per fallimento della scansione, e si applica solo agli aggiornamenti Plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, capacità del manifest, flag di policy, diagnostica, metadati di installazione, capacità del bundle e qualsiasi supporto server MCP o LSP rilevato senza importare di default il runtime Plugin. Aggiungi `--runtime` per caricare il modulo Plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai Plugin vengono solitamente installati come gruppi di comando root `openclaw`, ma i plugin possono anche registrare comandi annidati sotto un genitore core come `openclaw nodes`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo nel percorso indicato; per esempio un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin viene classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capability (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di capability (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capability o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capability

Consulta [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello delle capability.

<Note>
Il flag `--json` produce un report leggibile da macchina, adatto a scripting e audit. `inspect --all` mostra una tabella per l'intera flotta con colonne per forma, tipi di capability, avvisi di compatibilità, capability del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando è tutto pulito, stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, ad esempio proprietà del percorso o permessi scrivibili da tutti, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo, come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistito di OpenClaw per identità dei plugin installati, abilitazione, metadati di origine e proprietà dei contributi. Avvio normale, ricerca del proprietario del provider, classificazione della configurazione dei canali e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per verificare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice dei plugin persistito, dai criteri di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registro: se un package `@openclaw/*` orfano o recuperato sotto la root npm dei plugin gestiti mette in ombra un plugin incluso nel bundle, doctor rimuove quel package obsoleto e ricostruisce il registro, così l'avvio valida rispetto al manifest incluso nel bundle.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità break-glass deprecato per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback tramite env serve solo per il ripristino di emergenza dell'avvio durante il rollout della migrazione.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del Marketplace accetta un percorso Marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta dell'origine risolta più il manifest Marketplace analizzato e le voci dei plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
