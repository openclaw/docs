---
read_when:
    - Vuoi installare o gestire i Plugin Gateway o pacchetti compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-04T08:40:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3f0ac9412e24f3598e9bab6389f770b3d0d26268d9907891697919d9371f1c1
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci i Plugin del Gateway, i pacchetti di hook e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di Plugin" href="/it/tools/plugin">
    Guida per l'utente finale per installare, abilitare e risolvere i problemi dei Plugin.
  </Card>
  <Card title="Gestisci Plugin" href="/it/plugins/manage-plugins">
    Esempi rapidi per installazione, elenco, aggiornamento, disinstallazione e pubblicazione.
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
I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio provider di modelli inclusi, provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con un JSON Schema inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di elenco/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le funzionalità del bundle rilevate.
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
I nomi di pacchetto senza prefisso vengono installati da npm per impostazione predefinita durante la transizione di lancio. Usa `clawhub:<package>` per ClawHub. Tratta le installazioni dei Plugin come codice in esecuzione. Preferisci versioni fissate.
</Warning>

`plugins search` interroga ClawHub per pacchetti Plugin installabili e stampa
nomi di pacchetto pronti per l'installazione. Cerca pacchetti code-plugin e bundle-plugin,
non Skills. Usa `openclaw skills search` per le Skills di ClawHub.

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei Plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. I pacchetti Plugin
`@openclaw/*` di proprietà di OpenClaw sono di nuovo pubblicati su npm; vedi l'elenco attuale
su [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) o
[l'inventario dei Plugin](/it/plugins/plugin-inventory). Le installazioni stabili usano `latest`.
Le installazioni e gli aggiornamenti del canale beta preferiscono il dist-tag npm `beta` quando quel tag
è disponibile, poi ripiegano su `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e riparazione di configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` intatto. Include root, array di include e include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway e il ricaricamento a caldo, una configurazione Plugin non valida fallisce in modo chiuso come qualsiasi altra configurazione non valida; `openclaw doctor --fix` può mettere in quarantena la voce Plugin non valida. L'unica eccezione documentata in fase di installazione è uno stretto percorso di ripristino per Plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per aggiornamenti ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con installazioni `git:`; usa un ref git esplicito come `git:github.com/acme/plugin@v1.2.3` quando vuoi una fonte fissata. Non è supportato con `--marketplace`, perché le installazioni marketplace persistono metadati della fonte marketplace invece di una spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Permette all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi di policy dell'hook `before_install` del Plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni delle dipendenze Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di Skills ClawHub.

    Se un Plugin che hai pubblicato su ClawHub è bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti di hook e spec npm">
    `plugins install` è anche la superficie di installazione per pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per singolo hook, non per l'installazione del pacchetto.

    Le spec npm sono **solo registro** (nome pacchetto + **versione esatta** facoltativa o **dist-tag**). Spec Git/URL/file e intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi rendere esplicita la risoluzione npm. Anche le spec di pacchetto senza prefisso installano direttamente da npm durante la transizione di lancio.

    Le spec senza prefisso e `@latest` restano sul canale stabile. Le versioni correttive datate di OpenClaw come `2026.5.3-1` sono release stabili per questo controllo. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una spec di installazione senza prefisso corrisponde a un id Plugin ufficiale (per esempio `diffs`), OpenClaw installa direttamente la voce del catalogo. Per installare un pacchetto npm con lo stesso nome, usa una spec con scope esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Repository Git">
    Usa `git:<repo>` per installare direttamente da un repository git. Le forme supportate includono URL clone `git:github.com/owner/repo`, `git:owner/repo`, `https://` completo, `ssh://`, `git://`, `file://` e `git@host:owner/repo.git`. Aggiungi `@<ref>` o `#<ref>` per fare il checkout di un branch, tag o commit prima dell'installazione.

    Le installazioni Git clonano in una directory temporanea, fanno il checkout del ref richiesto quando presente, poi usano il normale installer della directory Plugin. Questo significa che validazione del manifest, scansione di codice pericoloso, lavoro di installazione del package manager e record di installazione si comportano come installazioni npm. Le installazioni git registrate includono URL/ref di origine più il commit risolto, così `openclaw plugins update` può risolvere di nuovo la fonte in seguito.

    Dopo l'installazione da git, usa `openclaw plugins inspect <id> --runtime --json` per verificare registrazioni runtime come metodi del Gateway e comandi CLI. Se il Plugin ha registrato una root CLI con `api.registerCli`, esegui quel comando direttamente tramite la CLI root di OpenClaw, per esempio `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido alla root estratta del Plugin; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva record di installazione.

    Sono supportate anche le installazioni marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Le spec Plugin compatibili con npm senza prefisso installano da npm per impostazione predefinita durante la transizione di lancio:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per rendere esplicita la risoluzione solo npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw controlla la compatibilità dichiarata dell'API Plugin / del Gateway minimo prima dell'installazione. Quando la versione ClawHub selezionata pubblica un artefatto ClawPack, OpenClaw scarica il `.tgz` npm-pack versionato, verifica l'header digest ClawHub e il digest dell'artefatto, poi lo installa tramite il normale percorso archivio. Le versioni ClawHub più vecchie senza metadati ClawPack installano ancora tramite il percorso di verifica dell'archivio pacchetto legacy. Le installazioni registrate conservano i propri metadati della fonte ClawHub, tipo di artefatto, integrità npm, shasum npm, nome tarball e dati digest ClawPack per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una spec registrata senza versione così `openclaw plugins update` può seguire release ClawHub più recenti; selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` rimangono fissati a quel selettore.

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
  <Tab title="Marketplace sources">
    - un nome di marketplace Claude noto da `~/.claude/plugins/known_marketplaces.json`
    - una radice di marketplace locale o un percorso `marketplace.json`
    - una forma abbreviata di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    Per i marketplace remoti caricati da GitHub o git, le voci Plugin devono rimanere all'interno del repository marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repository e rifiuta sorgenti Plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti Plugin non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso di elenco/info/abilitazione/disabilitazione. Oggi sono supportati Skills dei bundle, Skills di comando Claude, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` / `lspServers` dichiarati nel manifest, Skills di comando Cursor e directory hook compatibili con Codex; altre funzionalità dei bundle rilevate sono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Inventario leggibile dalla macchina più diagnostica del registro e stato di installazione delle dipendenze del pacchetto.
</ParamField>

<Note>
`plugins list` legge prima il registro Plugin locale persistito, con un fallback derivato solo dal manifest quando il registro è mancante o non valido. È utile per verificare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice Plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per distribuzioni remote/container, verifica di riavviare il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.

`plugins list --json` include il `dependencyStatus` di ciascun Plugin da `package.json`
`dependencies` e `optionalDependencies`. OpenClaw verifica se quei nomi di pacchetto
sono presenti lungo il normale percorso di lookup Node `node_modules` del Plugin; non
importa codice runtime del Plugin, non esegue un gestore di pacchetti e non ripara
dipendenze mancanti.
</Note>

`plugins search` è una ricerca nel catalogo remoto ClawHub. Non ispeziona lo
stato locale, non modifica la configurazione, non installa pacchetti e non carica codice runtime dei Plugin. I risultati di ricerca includono il nome del pacchetto ClawHub, famiglia, canale, versione, riepilogo e un suggerimento di installazione come `openclaw plugins install clawhub:<package>`.

Per lavorare su Plugin inclusi all'interno di un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw scoprirà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare la dist compilata.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra hook registrati e diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non installa mai dipendenze; usa `openclaw doctor --fix` per pulire lo stato legacy delle dipendenze o installare Plugin scaricabili configurati mancanti.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti su servizio/processo, percorso di configurazione e stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice Plugin gestito mantenendo non fissato il comportamento predefinito.
</Note>

### Indice Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la sorgente durevole dei metadati di installazione, inclusi i record per manifest Plugin danneggiati o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro Plugin a freddo.

Quando OpenClaw vede record legacy forniti `plugins.installs` nella configurazione, li sposta nell'indice Plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti affinché i metadati di installazione non vadano persi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, dall'indice Plugin persistito, dalle voci dell'elenco allow/deny dei Plugin e dalle voci collegate `plugins.load.paths` quando applicabile. A meno che `--keep-files` non sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova all'interno della radice delle estensioni Plugin di OpenClaw. Per i Plugin di memoria attiva, lo slot di memoria viene reimpostato a `memory-core`.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Quando passi un id Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel Plugin. Ciò significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte fissate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza una versione o tag risolve anch'esso tornando al record Plugin tracciato. Usalo quando un Plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` riutilizza la specifica Plugin tracciata a meno che tu non passi una nuova specifica. `openclaw update` conosce inoltre il canale di aggiornamento OpenClaw attivo: sul canale beta, i record Plugin npm e ClawHub della linea predefinita provano prima `@beta`, poi ripiegano sulla specifica predefinita/latest registrata se non esiste alcun rilascio beta del Plugin. Versioni esatte e tag espliciti restano fissati a quel selettore.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash attesi ed effettivi e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti Plugin. Non aggira comunque i blocchi di policy `before_install` dei Plugin né il blocco per fallimento della scansione, e si applica solo agli aggiornamenti Plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, sorgente, funzionalità del manifest, flag di policy, diagnostica, metadati di installazione, funzionalità dei bundle e qualsiasi supporto server MCP o LSP rilevato senza importare codice runtime del Plugin per impostazione predefinita. Aggiungi `--runtime` per caricare il modulo Plugin e includere hook registrati, strumenti, comandi, servizi, metodi Gateway e route HTTP. L'ispezione runtime segnala direttamente le dipendenze Plugin mancanti; installazioni e riparazioni restano in `openclaw plugins install`, `openclaw plugins update` e `openclaw doctor --fix`.

I comandi CLI di proprietà dei Plugin sono installati come gruppi di comandi root `openclaw`. Dopo che `inspect --runtime` mostra un comando sotto `cliCommands`, eseguilo come `openclaw <command> ...`; per esempio, un Plugin che registra `demo-git` può essere verificato con `openclaw demo-git ping`.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di funzionalità (ad esempio un Plugin solo provider)
- **hybrid-capability** — più tipi di funzionalità (ad esempio testo + parlato + immagini)
- **hook-only** — solo hook, nessuna funzionalità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna funzionalità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello delle funzionalità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a scripting e audit. `inspect --all` renderizza una tabella a livello di flotta con colonne per forma, tipi di funzionalità, avvisi di compatibilità, funzionalità dei bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito, stampa `No plugin issues detected.`

Se un Plugin configurato è presente su disco ma bloccato dai controlli di sicurezza dei percorsi del loader, la validazione della configurazione mantiene la voce Plugin e la segnala come `present but blocked`. Correggi la diagnostica precedente del Plugin bloccato, come proprietà del percorso o permessi world-writable, invece di rimuovere la configurazione `plugins.entries.<id>` o `plugins.allow`.

Per errori di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro Plugin locale è il modello di lettura a freddo persistito di OpenClaw per identità Plugin installata, abilitazione, metadati sorgente e proprietà dei contributi. Avvio normale, lookup del proprietario provider, classificazione della configurazione del canale e inventario Plugin possono leggerlo senza importare moduli runtime dei Plugin.

Usa `plugins registry` per verificare se il registry persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricrearlo dall’indice dei plugin persistente, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione a runtime.

`openclaw doctor --fix` ripara anche la deriva npm gestita adiacente al registry: se un pacchetto `@openclaw/*` orfano sotto la radice npm dei plugin gestiti oscura un plugin incluso, doctor rimuove quel pacchetto obsoleto e ricrea il registry in modo che l’avvio convalidi rispetto al manifest incluso.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità di emergenza deprecato per errori di lettura del registry. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il ripristino di emergenza dell’avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L’elenco del marketplace accetta un percorso di marketplace locale, un percorso `marketplace.json`, un’abbreviazione GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l’etichetta della sorgente risolta più il manifest marketplace analizzato e le voci dei plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
