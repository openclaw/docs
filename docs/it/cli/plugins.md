---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-30T08:45:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin del Gateway, pacchetti hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali per installare, abilitare e risolvere problemi dei plugin.
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Per indagare su installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Consulta [Debug](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. Anche l'output dettagliato di list/info mostra il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins install <package>                      # ClawHub prima, poi npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install npm:<package>                  # solo npm
openclaw plugins install <package> --force              # sovrascrivi l'installazione esistente
openclaw plugins install <package> --pin                # fissa la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
I nomi di pacchetto senza prefisso vengono controllati prima su ClawHub, poi su npm. Tratta le installazioni dei plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm
rimane un fallback supportato e un percorso di installazione diretta. Durante la migrazione a
ClawHub, OpenClaw distribuisce ancora alcuni pacchetti plugin `@openclaw/*` di proprietà di OpenClaw
su npm; le versioni di quei pacchetti possono essere in ritardo rispetto al sorgente incluso tra i cicli di rilascio
dei plugin. Se npm segnala come deprecato un pacchetto plugin di proprietà di OpenClaw,
quella versione pubblicata è un vecchio artefatto esterno; usa il plugin incluso con
l'OpenClaw corrente o un checkout locale finché non viene pubblicato un pacchetto npm più recente.
</Note>

<AccordionGroup>
  <Accordion title="Include di configurazione e recupero da configurazione non valida">
    Se la sezione `plugins` è basata su un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrivono in quel file incluso e lasciano `openclaw.json` invariato. Gli include alla radice, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Consulta [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway, la configurazione non valida per un plugin viene isolata a quel plugin, così gli altri canali e plugin possono continuare a funzionare; `openclaw doctor --fix` può mettere in quarantena la voce del plugin non valida. L'unica eccezione documentata al momento dell'installazione è un percorso ristretto di recupero dei plugin inclusi per i plugin che accettano esplicitamente `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o pacchetto hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace mantengono i metadati della fonte del marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi di policy degli hook `before_install` dei plugin e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle skill supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di skill da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per i pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per visibilità filtrata degli hook e abilitazione per singolo hook, non per l'installazione dei pacchetti.

    Le specifiche npm sono **solo registro** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Specifiche Git/URL/file e intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la shell ha impostazioni globali di installazione npm.

    Usa `npm:<package>` quando vuoi saltare la ricerca su ClawHub e installare direttamente da npm. Le specifiche di pacchetto senza prefisso preferiscono comunque ClawHub e ricorrono a npm solo quando ClawHub non ha quel pacchetto o quella versione.

    Le specifiche senza prefisso e `@latest` restano sul canale stabile. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione senza prefisso corrisponde a un id di plugin incluso (per esempio `diffs`), OpenClaw installa direttamente il plugin incluso. Per installare un pacchetto npm con lo stesso nome, usa una specifica con scope esplicito (per esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido alla radice del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le specifiche plugin compatibili con npm senza prefisso. Ricorre a npm solo se ClawHub non ha quel pacchetto o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per forzare la risoluzione solo tramite npm, per esempio quando ClawHub non è raggiungibile o sai che il pacchetto esiste solo su npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, controlla la compatibilità dichiarata con l'API plugin / il Gateway minimo, quindi lo installa tramite il normale percorso di archivio. Le installazioni registrate mantengono i metadati della fonte ClawHub per gli aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione, così `openclaw plugins update` può seguire le release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` rimangono fissati a quel selettore.

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
  <Tab title="Fonti marketplace">
    - un nome marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una radice marketplace locale o un percorso `marketplace.json`
    - un'abbreviazione di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole per marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta fonti con percorso relativo da quel repository e rifiuta fonti plugin HTTP(S), con percorso assoluto, git, GitHub e altre fonti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati bundle skill, command-skill Claude, impostazioni predefinite Claude `settings.json`, impostazioni predefinite Claude `.lsp.json` / `lspServers` dichiarate nel manifest, command-skill Cursor e directory hook Codex compatibili; le altre capacità dei bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
</Note>

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Mostra solo i plugin abilitati.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Passa dalla vista tabellare a righe di dettaglio per plugin con metadati di fonte/origine/versione/attivazione.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile da macchina più diagnostica del registro.
</ParamField>

<Note>
`plugins list` legge prima il registro locale persistente dei Plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un Plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato il codice del Plugin, l'abilitazione, la policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per distribuzioni remote/container, verifica di riavviare il processo figlio effettivo `openclaw gateway run`, non solo un processo wrapper.
</Note>

Per lavorare sui Plugin inclusi dentro un'immagine Docker pacchettizzata, esegui il bind mount della directory
sorgente del Plugin sopra il percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, così le normali installazioni pacchettizzate continuano a usare il dist compilato.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --json` mostra gli hook registrati e la diagnostica da un passaggio di ispezione con modulo caricato.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, gli indizi su servizio/processo, il percorso della configurazione e lo stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice dei Plugin gestiti mantenendo non fissato il comportamento predefinito.
</Note>

### Indice dei Plugin

I metadati di installazione dei Plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la fonte persistente dei metadati di installazione, inclusi i record per manifest di Plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifest. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e dal registro a freddo dei Plugin.

Quando OpenClaw vede record legacy distribuiti `plugins.installs` nella configurazione, li sposta nell'indice dei Plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti affinché i metadati di installazione non vadano persi.

### Dipendenze runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` ispeziona lo stage delle dipendenze runtime pacchettizzate per i Plugin inclusi di proprietà OpenClaw selezionati dalla configurazione dei Plugin, dai canali abilitati/configurati, dai provider di modelli configurati o dai valori predefiniti dei manifest inclusi. Non è il percorso di installazione/aggiornamento per Plugin npm di terze parti o ClawHub.

Usa `--repair` quando un'installazione pacchettizzata segnala dipendenze runtime mancanti dei Plugin inclusi durante l'avvio del Gateway o `plugins doctor`. La riparazione installa solo le dipendenze mancanti dei Plugin inclusi abilitati con gli script del ciclo di vita disabilitati. Usa `--prune` per rimuovere radici di dipendenze runtime esterne sconosciute obsolete lasciate da layout pacchettizzati più vecchi.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del Plugin da `plugins.entries`, dall'indice persistente dei Plugin, dalle voci degli elenchi allow/deny dei Plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova dentro la radice delle estensioni Plugin di OpenClaw. Per i Plugin di Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni tracciate dei Plugin nell'indice dei Plugin gestiti e alle installazioni tracciate degli hook-pack in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione tra id del Plugin e specifica npm">
    Quando passi un id del Plugin, OpenClaw riutilizza la specifica di installazione registrata per quel Plugin. Questo significa che i dist-tag archiviati in precedenza, come `@beta`, e le versioni esatte fissate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record del Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza una versione o tag risolve anch'esso al record del Plugin tracciato. Usalo quando un Plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità archiviato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash previsto ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install su update">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione built-in del codice pericoloso durante gli aggiornamenti dei Plugin. Continua a non bypassare i blocchi della policy `before_install` del Plugin né il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita per un singolo Plugin. Mostra identità, stato di caricamento, sorgente, capacità registrate, hook, strumenti, comandi, servizi, metodi Gateway, route HTTP, flag di policy, diagnostica, metadati di installazione, capacità del bundle e qualsiasi supporto rilevato per server MCP o LSP.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un solo tipo di capacità (ad es. un Plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad es. testo + parlato + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Consulta [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello delle capacità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto a scripting e audit. `inspect --all` renderizza una tabella dell'intero parco con forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e colonne di riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei Plugin, diagnostica di manifest/rilevamento e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Per errori di forma del modulo come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei Plugin è il modello di lettura a freddo persistente di OpenClaw per identità dei Plugin, abilitazione, metadati sorgente e proprietà dei contributi. Avvio normale, lookup del proprietario del provider, classificazione della configurazione dei canali e inventario dei Plugin possono leggerlo senza importare moduli runtime dei Plugin.

Usa `plugins registry` per verificare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistente dei Plugin, dalla policy di configurazione e dai metadati di manifest/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità deprecato di emergenza per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il recupero di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta sorgente risolta più il manifest marketplace analizzato e le voci dei Plugin.

## Correlati

- [Creare Plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
