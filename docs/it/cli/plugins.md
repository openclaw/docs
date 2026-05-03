---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento della CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-03T21:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per utenti finali per installare, abilitare e risolvere i problemi dei plugin.
  </Card>
  <Card title="Gestisci plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
  </Card>
  <Card title="Bundle di Plugin" href="/it/plugins/bundles">
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

Per indagare su installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I plugin in bundle vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio provider di modelli in bundle, provider vocali in bundle e il plugin browser in bundle); altri richiedono `plugins enable`.

I plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo di bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
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
I nomi di pacchetto semplici installano da npm per impostazione predefinita durante la transizione di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei plugin come esecuzione di codice. Preferisci versioni bloccate.
</Warning>

`plugins search` interroga ClawHub per pacchetti plugin installabili e stampa nomi di pacchetto pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin, non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm rimane un fallback supportato e un percorso di installazione diretta. I pacchetti plugin `@openclaw/*` di proprietà di OpenClaw sono nuovamente pubblicati su npm; consulta l'elenco corrente su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'[inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`. Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag è disponibile, poi ricadono su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione di configurazioni non valide">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Include radice, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di recupero per plugin in bundle che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un riferimento git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte bloccata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono metadati della fonte marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Permette all'installazione di proseguire anche quando lo scanner integrato riporta risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` dei plugin e **non** aggira i fallimenti di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni delle dipendenze delle skill basate su Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione delle skill ClawHub.

    Se un plugin che hai pubblicato su ClawHub è bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti di hook e spec npm">
    `plugins install` è anche la superficie di installazione per pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** o **dist-tag** opzionale). Spec Git/URL/file e intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetto semplici installano direttamente da npm durante la transizione di lancio.

    Le spec semplici e `@latest` restano sul canale stabile. Se npm risolve una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione semplice corrisponde a un id di plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec con scope esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono URL di clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per eseguire il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, eseguono il checkout del riferimento richiesto quando presente, quindi usano il normale installer della directory plugin. Ciò significa che validazione del manifest, scansione di codice pericoloso, lavoro di installazione del package manager e record di installazione si comportano come nelle installazioni npm. Le installazioni git registrate includono l'URL/riferimento della fonte più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la fonte in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare registrazioni runtime come metodi gateway e comandi CLI. Se il plugin ha registrato una radice CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI radice di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella radice del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un locator esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec plugin compatibili con npm semplici installano da npm per impostazione predefinita durante la transizione di lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica la compatibilità pubblicizzata dell'API plugin / minima del gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack con versione, verifica l'header digest ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso archivio. Le versioni ClawHub più vecchie senza metadati ClawPack continuano a installare tramite il percorso legacy di verifica dell'archivio pacchetto. Le installazioni registrate conservano i metadati della fonte ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i dati del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una spec registrata senza versione così `openclaw plugins update` può seguire le release ClawHub più recenti; selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano bloccati su quel selettore.

#### Abbreviazione marketplace

Usa l'abbreviazione `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente la fonte del marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Sorgenti del marketplace">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice di marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono rimanere all'interno del repository del marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repository e rifiuta sorgenti di plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti di plugin remote non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, Skills di comando Claude, valori predefiniti di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` / `lspServers` dichiarati dal manifest, Skills di comando Cursor e directory hook Codex compatibili; altre funzionalità di bundle rilevate sono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è un probe runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o hook venga eseguito. Per distribuzioni remote/container, verifica di riavviare il processo figlio `openclaw gateway run` effettivo, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del plugin; non
importa codice runtime del plugin, esegue un package manager o ripara dipendenze
mancanti.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo stato
locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime del plugin. I risultati di ricerca includono il nome del pacchetto ClawHub, famiglia, canale, versione, riepilogo e
un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare sui plugin inclusi in un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato di dipendenze legacy o installare plugin scaricabili configurati mancanti.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso della configurazione e integrità RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la spec esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo non fissato il comportamento predefinito.
</Note>

### Indice dei plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi record per manifest di plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro dei plugin a freddo.

Quando OpenClaw vede record legacy `plugins.installs` distribuiti nella configurazione, li sposta nell'indice dei plugin e rimuove la chiave di configurazione; se una delle scritture fallisce, i record di configurazione vengono mantenuti in modo che i metadati di installazione non vadano persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove record dei plugin da `plugins.entries`, dall'indice persistente dei plugin, dalle voci delle liste allow/deny dei plugin e dalle voci `plugins.load.paths` collegate quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni plugin di OpenClaw. Per i plugin di memoria attiva, lo slot di memoria viene reimpostato a `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni di plugin tracciate nell'indice dei plugin gestiti e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id plugin e spec npm">
    Quando passi un id plugin, OpenClaw riutilizza la spec di installazione registrata per quel plugin. Questo significa che dist-tag memorizzati in precedenza come `@beta` e versioni fissate esatte continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una spec esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto risalendo al record del plugin tracciato, aggiorna quel plugin installato e registra la nuova spec npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso al record del plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la spec del plugin tracciata a meno che tu non passi una nuova spec. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record di plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla spec predefinita/latest registrata se non esiste alcuna release beta del plugin. Le versioni esatte e i tag espliciti restano fissati a quel selettore.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw verifica la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso e effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install in aggiornamento">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei plugin. Non bypassa comunque i blocchi di policy `before_install` del plugin o il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, funzionalità del manifest, flag di policy, diagnostica, metadati di installazione, funzionalità del bundle ed eventuale supporto server MCP o LSP rilevato senza importare il runtime del plugin per impostazione predefinita. Aggiungi `--runtime` per caricare il modulo del plugin e includere hook, strumenti, comandi, servizi, metodi gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze mancanti del plugin; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI posseduti dai plugin sono installati come gruppi di comandi `openclaw` radice. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio un plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di funzionalità (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di funzionalità (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna funzionalità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna funzionalità

Vedi [Forme dei plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello di funzionalità.

<Note>
Il flag `--json` produce un report leggibile da macchina adatto a scripting e audit. `inspect --all` rende una tabella sull'intero parco con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità del bundle e riepilogo degli hook. `info` è un alias per `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Se un plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la validazione della configurazione mantiene la voce del plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del plugin bloccato, come proprietà del percorso o permessi world-writable, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistente di OpenClaw per identità dei plugin, abilitazione, metadati di sorgente e proprietà dei contributi. Avvio normale, lookup del proprietario del provider, classificazione della configurazione dei canali e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per verificare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall’indice Plugin persistente, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione a runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità break-glass deprecato per gli errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback tramite variabile d’ambiente serve solo per il ripristino di emergenza all’avvio durante il rollout della migrazione.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L’elenco del Marketplace accetta un percorso locale del Marketplace, un percorso `marketplace.json`, un’abbreviazione GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l’etichetta della fonte risolta, oltre al manifest Marketplace analizzato e alle voci Plugin.

## Correlati

- [Creare Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
