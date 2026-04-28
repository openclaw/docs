---
read_when:
    - Vuoi installare o gestire i plugin del Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (elenco, installazione, marketplace, disinstallazione, abilitazione/disabilitazione, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Gestisci i plugin del Gateway, gli hook pack e i bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema di plugin" href="/it/tools/plugin">
    Guida per utenti finali all'installazione, abilitazione e risoluzione dei problemi dei plugin.
  </Card>
  <Card title="Bundle di plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest del plugin" href="/it/plugins/manifest">
    Campi del manifest e schema di configurazione.
  </Card>
  <Card title="Sicurezza" href="/it/gateway/security">
    Hardening della sicurezza per le installazioni dei plugin.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
I plugin inclusi sono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` oppure `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` oppure `cursor`) più le capability del bundle rilevate.
</Note>

### Installa

```bash
openclaw plugins install <package>                      # ClawHub prima, poi npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sovrascrive l'installazione esistente
openclaw plugins install <package> --pin                # fissa la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
I nomi package non qualificati vengono controllati prima su ClawHub, poi su npm. Considera l'installazione dei plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

<AccordionGroup>
  <Accordion title="Include di configurazione e recupero da configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrivono direttamente in quel file incluso e lasciano invariato `openclaw.json`. Include root, array di include e include con override sibling falliscono in modo chiuso invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida, `plugins install` normalmente fallisce in modo chiuso e ti dice di eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso ristretto di recupero per plugin inclusi che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione vs aggiornamento">
    `--force` riusa il target di installazione esistente e sovrascrive sul posto un plugin o hook pack già installato. Usalo quando stai intenzionalmente reinstallando lo stesso id da un nuovo percorso locale, archivio, package ClawHub o artifact npm. Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale aggiornamento, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente del marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione break-glass per falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato riporta risultati `critical`, ma **non** aggira i blocchi di policy degli hook plugin `before_install` e **non** aggira i fallimenti della scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento plugin. Le installazioni delle dipendenze Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta un flusso separato di download/installazione di Skills da ClawHub.

  </Accordion>
  <Accordion title="Hook pack e specifiche npm">
    `plugins install` è anche la superficie di installazione per gli hook pack che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei package.

    Le specifiche npm sono **solo registry** (nome package + **versione esatta** facoltativa oppure **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

    Le specifiche non qualificate e `@latest` restano sul canale stabile. Se npm risolve una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione non qualificata corrisponde a un id di plugin incluso (ad esempio `diffs`), OpenClaw installa direttamente il plugin incluso. Per installare un package npm con lo stesso nome, usa una specifica scoped esplicita (ad esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido alla root del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni da ClawHub usano un locator esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le specifiche di plugin bare compatibili con npm. Ripiega su npm solo se ClawHub non ha quel package o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del package da ClawHub, controlla la compatibilità pubblicizzata dell'API plugin / gateway minimo, quindi lo installa attraverso il normale percorso degli archivi. Le installazioni registrate mantengono i metadati della sorgente ClawHub per aggiornamenti successivi.

#### Abbreviazione marketplace

Usa la forma abbreviata `plugin@marketplace` quando il nome del marketplace esiste nella cache locale del registry di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una root di marketplace locale o un percorso `marketplace.json`
    - una forma abbreviata di repo GitHub come `owner/repo`
    - un URL di repo GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole dei marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci plugin devono restare all'interno del repo marketplace clonato. OpenClaw accetta sorgenti a percorso relativo da quel repo e rifiuta sorgenti plugin HTTP(S), absolute-path, git, GitHub e altre sorgenti non-path dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout componente predefinito di Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale root dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills di Claude, valori predefiniti `settings.json` di Claude, valori predefiniti `lspServers` di Claude `.lsp.json` / dichiarati nel manifest, command-skills di Cursor e directory hook compatibili con Codex; altre capability dei bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
  Passa dalla vista tabellare a righe di dettaglio per plugin con metadati di source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inventario leggibile da macchina più diagnostica del registry.
</ParamField>

<Note>
`plugins list` legge prima il registry locale persistito dei plugin, con fallback derivato solo dal manifest quando il registry è mancante o non valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una probe runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che nuovo codice `register(api)` o hook vengano eseguiti. Per distribuzioni remote/container, verifica di stare riavviando il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.
</Note>

Per lavorare con plugin inclusi all'interno di un'immagine Docker pacchettizzata, monta in bind la directory sorgente del plugin
sul percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente
copiata resta inerte, quindi le normali installazioni pacchettizzate continuano a usare la dist compilata.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --json` mostra gli hook registrati e la diagnostica da un passaggio di ispezione con modulo caricato.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, suggerimenti di servizio/processo, percorso di configurazione e stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (la aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riusano il percorso sorgente invece di copiare sopra un target di installazione gestito.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) nell'indice plugin gestito mantenendo il comportamento predefinito non fissato.
</Note>

### Indice dei plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` sotto la directory di stato OpenClaw attiva. La mappa di primo livello `installRecords` è la fonte durevole dei metadati di installazione, inclusi i record per manifest plugin rotti o mancanti. L'array `plugins` è la cache del registry a freddo derivata dal manifest. Il file include un avviso di non modifica manuale ed è usato da `openclaw plugins update`, uninstall, diagnostica e dal registry plugin a freddo.

Quando OpenClaw vede record legacy `plugins.installs` distribuiti nella configurazione, li sposta nell'indice plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Disinstalla

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record plugin da `plugins.entries`, dall'indice plugin persistito, dalle voci della lista consenti/nega dei plugin e dalle voci collegate in `plugins.load.paths` quando applicabile. A meno che non sia impostato `--keep-files`, uninstall rimuove anche la directory di installazione gestita tracciata quando si trova all'interno della root delle estensioni plugin di OpenClaw. Per i plugin di memoria attiva, lo slot di memoria viene reimpostato a `memory-core`.

<Note>
`--keep-config` è supportato come alias deprecato di `--keep-files`.
</Note>

### Aggiorna

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni di plugin tracciate nell'indice plugin gestito e alle installazioni di hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione di id plugin vs specifica npm">
    Quando passi un id plugin, OpenClaw riusa la specifica di installazione registrata per quel plugin. Questo significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte fissate continuano a essere usati nelle esecuzioni successive di `update <id>`.

    Per le installazioni npm, puoi anche passare una specifica package npm esplicita con un dist-tag o una versione esatta. OpenClaw risolve quel nome package risalendo al record plugin tracciato, aggiorna quel plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

    Passare il nome package npm senza versione o tag risolve comunque il record plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registry.

  </Accordion>
  <Accordion title="Controlli di versione e deriva di integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del package installato rispetto ai metadati del registry npm. Se la versione installata e l'identità dell'artifact registrata corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artifact recuperato cambia, OpenClaw lo tratta come deriva dell'artifact npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante non fornisca una policy esplicita di continuazione.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante update">
    `--dangerously-force-unsafe-install` è disponibile anche in `plugins update` come override break-glass per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei plugin. Continua comunque a non aggirare i blocchi di policy `before_install` dei plugin o il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non a quelli degli hook-pack.
  </Accordion>
</AccordionGroup>

### Ispeziona

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita per un singolo plugin. Mostra identità, stato di caricamento, source, capability registrate, hook, tool, comandi, servizi, metodi gateway, route HTTP, flag di policy, diagnostica, metadati di installazione, capability del bundle ed eventuale supporto MCP o server LSP rilevato.

Ogni plugin è classificato in base a ciò che registra realmente a runtime:

- **plain-capability** — un solo tipo di capability (ad es. un plugin solo provider)
- **hybrid-capability** — più tipi di capability (ad es. testo + voce + immagini)
- **hook-only** — solo hook, nessuna capability o superficie
- **non-capability** — tool/comandi/servizi ma nessuna capability

Vedi [Forme dei plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello di capability.

<Note>
Il flag `--json` produce un report leggibile da macchina adatto per script e audit. `inspect --all` rende una tabella dell'intera flotta con colonne per shape, tipi di capability, avvisi di compatibilità, capability del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` riporta errori di caricamento dei plugin, diagnostica di manifest/individuazione e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Per errori di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registry plugin locale è il modello di lettura a freddo persistito di OpenClaw per identità del plugin installato, abilitazione, metadati della source e proprietà dei contributi. L'avvio normale, la ricerca del proprietario del provider, la classificazione della configurazione del canale e l'inventario dei plugin possono leggerlo senza importare i moduli runtime dei plugin.

Usa `plugins registry` per ispezionare se il registry persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice plugin persistito, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità break-glass deprecato per errori di lettura del registry. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env serve solo per il recupero d'emergenza all'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repo GitHub oppure un URL git. `--json` stampa l'etichetta della source risolta più il manifest marketplace analizzato e le voci plugin.

## Correlati

- [Creare plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
