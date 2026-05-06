---
read_when:
    - Vuoi installare o gestire i Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-06T08:43:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/it/tools/plugin">
    Guida per utenti finali all'installazione, all'abilitazione e alla risoluzione dei problemi dei plugin.
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

Per indagare su operazioni lente di installazione, ispezione, disinstallazione o aggiornamento del registro, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive le tempistiche delle fasi
su stderr e mantiene analizzabile l'output JSON. Vedi [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifesti di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/informazioni mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le funzionalità del bundle rilevate.
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
I nomi di pacchetti non qualificati installano da npm per impostazione predefinita durante la transizione del lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti di plugin installabili e stampa
nomi di pacchetti pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti di plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; consulta l'elenco attuale
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o l'
[inventario dei plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Gli include root, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce plugin non valida. L'unica eccezione documentata in fase di installazione è uno stretto percorso di recupero per plugin inclusi che scelgono esplicitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono i metadati della fonte marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner di codice pericoloso integrato. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi di policy degli hook `before_install` del plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle skill supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione delle skill da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` è anche la superficie di installazione per pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per singolo hook, non per l'installazione del pacchetto.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Le spec Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni di dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetti non qualificate installano direttamente da npm durante la transizione del lancio.

    Le spec non qualificate e `@latest` restano sul canale stabile. Le versioni correttive datate di OpenClaw come `2026.5.3-1` sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione non qualificata corrisponde a un id plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec scoped esplicita (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono `git:github.com/owner/repo`, `git:owner/repo`, URL di clone completi `https://`, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno checkout del ref richiesto quando presente, poi usano il normale installer della directory plugin. Questo significa che convalida del manifesto, scansione di codice pericoloso, lavoro di installazione del package manager e record di installazione si comportano come installazioni npm. Le installazioni git registrate includono URL/ref della fonte più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la fonte in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare le registrazioni runtime come metodi gateway e comandi CLI. Se il plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella root del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Usa `npm-pack:<path.tgz>` quando il file è un tarball npm-pack e vuoi
    testare lo stesso percorso gestito di installazione nella root npm usato dalle installazioni da registro,
    inclusi verifica di `package-lock.json`, scansione delle dipendenze hoisted e
    record di installazione npm. I percorsi di archivio semplici si installano comunque come archivi locali
    sotto la root delle estensioni plugin.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec plugin compatibili con npm non qualificate installano da npm per impostazione predefinita durante la transizione del lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw verifica l'API plugin pubblicizzata / la compatibilità minima del gateway prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header digest di ClawHub e il digest dell'artefatto, quindi lo installa tramite il normale percorso archivio. Le versioni ClawHub più vecchie senza metadati ClawPack si installano comunque tramite il percorso legacy di verifica dell'archivio del pacchetto. Le installazioni registrate conservano i metadati della fonte ClawHub, il tipo di artefatto, l'integrità npm, lo shasum npm, il nome del tarball e i fatti del digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione conservano una spec registrata senza versione così `openclaw plugins update` può seguire release ClawHub più nuove; selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` rimangono fissati a quel selettore.

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
  <Tab title="Origini del marketplace">
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice di marketplace locale o un percorso `marketplace.json`
    - una forma abbreviata di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei Plugin devono rimanere dentro il repository marketplace clonato. OpenClaw accetta origini con percorso relativo da quel repository e rifiuta HTTP(S), percorsi assoluti, git, GitHub e altre origini Plugin non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso di elenco/info/abilitazione/disabilitazione. Al momento sono supportati Skills dei bundle, Skills di comando Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarati nel manifest, Skills di comando Cursor e directory di hook Codex compatibili; altre funzionalità dei bundle rilevate sono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Inventario leggibile da macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei Plugin, con un fallback derivato solo dal manifest quando il registro è mancante o non valido. È utile per controllare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del Plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per distribuzioni remote/container, verifica di riavviare il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ogni Plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw controlla se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del Plugin; non
importa codice runtime del Plugin, non esegue un package manager e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo
stato locale, non modifica la config, non installa pacchetti e non carica codice
runtime del Plugin. I risultati di ricerca includono nome del pacchetto ClawHub,
famiglia, canale, versione, riepilogo e un suggerimento di installazione come
`openclaw plugins install clawhub:<package>`.

Per il lavoro sui Plugin inclusi dentro un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, come
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay di sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato delle dipendenze legacy o recuperare Plugin scaricabili mancanti referenziati dalla config.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso della config e integrità RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei Plugin gestiti, mantenendo non bloccato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non config utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi record per manifest Plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dai manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro Plugin a freddo.

Quando OpenClaw vede record legacy distribuiti `plugins.installs` nella config, li sposta nell'indice dei Plugin e rimuove la chiave di config; se una delle due scritture fallisce, i record di config vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, dall'indice Plugin persistente, dalle voci degli elenchi consenti/nega dei Plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i Plugin di memoria attiva, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni Plugin tracciate nell'indice dei Plugin gestiti e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id del Plugin e specifica npm">
    Quando passi un id Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel Plugin. Ciò significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso al record Plugin tracciato. Usalo quando un Plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Aggiornamenti del canale beta">
    `openclaw plugins update` riutilizza la specifica Plugin tracciata a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica predefinita/latest registrata se non esiste una release beta del Plugin. Le versioni esatte e i tag espliciti rimangono bloccati su quel selettore.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash previsto ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante l'aggiornamento">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione integrata del codice pericoloso durante gli aggiornamenti dei Plugin. Continua a non aggirare blocchi di policy `before_install` del Plugin o blocchi per fallimento della scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, origine, funzionalità del manifest, flag di policy, diagnostica, metadati di installazione, funzionalità del bundle e qualsiasi supporto server MCP o LSP rilevato senza importare codice runtime del Plugin per impostazione predefinita. Aggiungi `--runtime` per caricare il modulo del Plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà del Plugin sono installati come gruppi di comandi radice `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio un Plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di funzionalità (ad es. un Plugin solo provider)
- **hybrid-capability** — più tipi di funzionalità (ad es. testo + parlato + immagini)
- **hook-only** — solo hook, nessuna funzionalità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna funzionalità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori dettagli sul modello di funzionalità.

<Note>
Il flag `--json` produce un report leggibile da macchina adatto a scripting e audit. `inspect --all` renderizza una tabella per l'intero parco con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando è tutto pulito stampa `No plugin issues detected.`

Se un Plugin configurato è presente su disco ma bloccato dai controlli di sicurezza del percorso del loader, la validazione della config mantiene la voce Plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del Plugin bloccato, come proprietà del percorso o permessi scrivibili da tutti, invece di rimuovere la config `plugins.entries.<id>` o `plugins.allow`.

Per fallimenti di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei Plugin è il modello di lettura a freddo persistito di OpenClaw per l'identità dei Plugin installati, l'abilitazione, i metadati di origine e la proprietà dei contributi. L'avvio normale, la ricerca del proprietario del provider, la classificazione della configurazione dei canali e l'inventario dei Plugin possono leggerlo senza importare moduli runtime dei Plugin.

Usa `plugins registry` per verificare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice dei Plugin persistito, dai criteri di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registro: se un pacchetto `@openclaw/*` orfano o recuperato sotto la radice npm dei Plugin gestiti mette in ombra un Plugin integrato, doctor rimuove quel pacchetto obsoleto e ricostruisce il registro, così l'avvio convalida rispetto al manifest integrato.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un'opzione di compatibilità deprecata di emergenza per gli errori di lettura del registro. Preferisci `plugins registry --refresh` oppure `openclaw doctor --fix`; il fallback tramite variabile d'ambiente serve solo per il ripristino di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Mercato

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del mercato accetta un percorso locale del mercato, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub oppure un URL git. `--json` stampa l'etichetta di origine risolta più il manifest del mercato analizzato e le voci dei Plugin.

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
