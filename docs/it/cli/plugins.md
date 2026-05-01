---
read_when:
    - Vuoi installare o gestire Plugin del Gateway o pacchetti compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei Plugin
sidebarTitle: Plugins
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-05-01T08:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc4b2b753b541dd143e9c2f7e8a2153711a18e15773c65f91756d2729ca3d6fb
    source_path: cli/plugins.md
    workflow: 16
---

Gestisci Plugin Gateway, pacchetti di hook e bundle compatibili.

<CardGroup cols={2}>
  <Card title="Sistema Plugin" href="/it/tools/plugin">
    Guida per utenti finali per installare, abilitare e risolvere i problemi dei plugin.
  </Card>
  <Card title="Bundle Plugin" href="/it/plugins/bundles">
    Modello di compatibilità dei bundle.
  </Card>
  <Card title="Manifest Plugin" href="/it/plugins/manifest">
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
openclaw plugins inspect <id> --runtime
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

Per analizzare installazioni, ispezioni, disinstallazioni o aggiornamenti del registro lenti, esegui il
comando con `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. La traccia scrive i tempi delle fasi
su stderr e mantiene analizzabile l'output JSON. Consulta [Debugging](/it/help/debugging#plugin-lifecycle-trace).

<Note>
I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono distribuire `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.
</Note>

### Installazione

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
I nomi di pacchetto non qualificati vengono controllati prima su ClawHub, poi su npm. Tratta le installazioni dei plugin come l'esecuzione di codice. Preferisci versioni fissate.
</Warning>

<Note>
ClawHub è la superficie principale di distribuzione e scoperta per la maggior parte dei plugin. Npm
rimane un percorso di fallback e di installazione diretta supportato. Durante la migrazione a
ClawHub, OpenClaw distribuisce ancora alcuni pacchetti Plugin `@openclaw/*` di proprietà di OpenClaw
su npm; tali versioni dei pacchetti possono essere in ritardo rispetto al sorgente incluso tra i cicli di rilascio
dei plugin. Se npm segnala come deprecato un pacchetto Plugin di proprietà di OpenClaw,
quella versione pubblicata è un vecchio artefatto esterno; usa il plugin incluso con
l'OpenClaw corrente o un checkout locale finché non viene pubblicato un pacchetto npm più recente.
</Note>

<AccordionGroup>
  <Accordion title="Include della configurazione e ripristino da configurazione non valida">
    Se la tua sezione `plugins` è supportata da un `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia `openclaw.json` invariato. Gli include root, gli array di include e gli include con override fratelli falliscono in modo chiuso invece di essere appiattiti. Consulta [Include della configurazione](/it/gateway/configuration) per le forme supportate.

    Se la configurazione non è valida durante l'installazione, `plugins install` normalmente fallisce in modo chiuso e ti indica di eseguire prima `openclaw doctor --fix`. Durante l'avvio del Gateway, la configurazione non valida per un plugin viene isolata a quel plugin, così altri canali e plugin possono continuare a funzionare; `openclaw doctor --fix` può mettere in quarantena la voce del plugin non valida. L'unica eccezione documentata in fase di installazione è un percorso ristretto di ripristino dei plugin inclusi per i plugin che aderiscono esplicitamente a `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force e reinstallazione rispetto ad aggiornamento">
    `--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o un pacchetto di hook già installato. Usalo quando stai reinstallando intenzionalmente lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti di routine di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

    Se esegui `plugins install` per un id plugin già installato, OpenClaw si ferma e ti indica `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una fonte diversa.

  </Accordion>
  <Accordion title="Ambito di --pin">
    `--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace conservano i metadati della fonte del marketplace invece di una specifica npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` del plugin e **non** aggira gli errori di scansione.

    Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze delle skill supportate da Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di skill da ClawHub.

    Se un plugin che hai pubblicato su ClawHub viene bloccato da una scansione del registro, usa i passaggi per publisher in [ClawHub](/it/tools/clawhub).

  </Accordion>
  <Accordion title="Pacchetti di hook e specifiche npm">
    `plugins install` è anche la superficie di installazione per pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione di pacchetti.

    Le specifiche npm sono **solo registro** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni di installazione npm globali.

    Usa `npm:<package>` quando vuoi saltare la ricerca su ClawHub e installare direttamente da npm. Le specifiche di pacchetto non qualificate preferiscono comunque ClawHub e ricadono su npm solo quando ClawHub non ha quel pacchetto o quella versione.

    Le specifiche non qualificate e `@latest` restano sul canale stabile. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag di prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

    Se una specifica di installazione non qualificata corrisponde all'id di un plugin incluso (ad esempio `diffs`), OpenClaw installa direttamente il plugin incluso. Per installare un pacchetto npm con lo stesso nome, usa una specifica con scope esplicito (ad esempio `@scope/diffs`).

  </Accordion>
  <Accordion title="Archivi">
    Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Gli archivi di Plugin OpenClaw nativi devono contenere un `openclaw.plugin.json` valido nella root del plugin estratto; gli archivi che contengono solo `package.json` vengono rifiutati prima che OpenClaw scriva i record di installazione.

    Sono supportate anche le installazioni dal marketplace Claude.

  </Accordion>
</AccordionGroup>

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le specifiche plugin non qualificate sicure per npm. Ricade su npm solo se ClawHub non ha quel pacchetto o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

Usa `npm:` per forzare la risoluzione solo npm, ad esempio quando ClawHub non è raggiungibile o sai che il pacchetto esiste solo su npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, controlla l'API Plugin pubblicizzata / la compatibilità minima del gateway, poi lo installa tramite il normale percorso di archivio. Le installazioni registrate mantengono i metadati della fonte ClawHub per aggiornamenti successivi.
Le installazioni ClawHub senza versione mantengono una specifica registrata senza versione così `openclaw plugins update` può seguire le release ClawHub più recenti; i selettori espliciti di versione o tag come `clawhub:pkg@1.2.3` e `clawhub:pkg@beta` restano fissati a quel selettore.

#### Scorciatoia marketplace

Usa la scorciatoia `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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
    - un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
    - una root marketplace locale o un percorso `marketplace.json`
    - una scorciatoia di repository GitHub come `owner/repo`
    - un URL di repository GitHub come `https://github.com/owner/repo`
    - un URL git

  </Tab>
  <Tab title="Regole dei marketplace remoti">
    Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta fonti con percorso relativo da quel repository e rifiuta fonti di plugin HTTP(S), con percorso assoluto, git, GitHub e altre fonti non basate su percorso dai manifest remoti.
  </Tab>
</Tabs>

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

<Note>
I bundle compatibili vengono installati nella normale root dei plugin e partecipano allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, command-skills Claude, valori predefiniti `settings.json` di Claude, valori predefiniti Claude `.lsp.json` / `lspServers` dichiarati nel manifest, command-skills Cursor e directory di hook Codex compatibili; le altre capacità di bundle rilevate sono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.
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
`plugins list` legge prima il registro locale persistente dei plugin, con un fallback derivato solo dal manifesto quando il registro manca o non è valido. È utile per verificare se un plugin è installato, abilitato e visibile alla pianificazione dell'avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato codice del plugin, abilitazione, policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione di nuovo codice `register(api)` o di nuovi hook. Per distribuzioni remote/container, verifica di riavviare il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.
</Note>

Per il lavoro su plugin inclusi in un'immagine Docker pacchettizzata, monta con bind la directory
sorgente del plugin sopra il percorso sorgente pacchettizzato corrispondente, ad esempio
`/app/extensions/synology-chat`. OpenClaw rileverà quell'overlay sorgente montato
prima di `/app/dist/extensions/synology-chat`; una semplice directory sorgente copiata
rimane inerte, quindi le normali installazioni pacchettizzate continuano a usare la dist compilata.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --runtime --json` mostra gli hook registrati e la diagnostica da un passaggio di ispezione con modulo caricato. L'ispezione runtime non scarica mai dipendenze runtime incluse mancanti; usa `openclaw plugins deps --repair` quando è necessaria una riparazione.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, gli indizi su servizio/processo, il percorso della configurazione e lo stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la spec esatta risolta (`name@version`) nell'indice dei plugin gestiti mantenendo il comportamento predefinito non fissato.
</Note>

### Indice dei Plugin

I metadati di installazione dei plugin sono stato gestito dalla macchina, non configurazione utente. Installazioni e aggiornamenti li scrivono in `plugins/installs.json` nella directory di stato OpenClaw attiva. La sua mappa di primo livello `installRecords` è la fonte durevole dei metadati di installazione, inclusi record per manifesti plugin rotti o mancanti. L'array `plugins` è la cache del registro a freddo derivata dal manifesto. Il file include un avviso di non modifica ed è usato da `openclaw plugins update`, disinstallazione, diagnostica e registro plugin a freddo.

Quando OpenClaw rileva record legacy distribuiti `plugins.installs` nella configurazione, li sposta nell'indice dei plugin e rimuove la chiave di configurazione; se una delle due scritture fallisce, i record di configurazione vengono mantenuti così i metadati di installazione non vanno persi.

### Dipendenze runtime

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` ispeziona lo stage delle dipendenze runtime pacchettizzate per i plugin inclusi di proprietà di OpenClaw selezionati dalla configurazione dei plugin, dai canali abilitati/configurati, dai provider di modelli configurati o dai default dei manifesti inclusi. Non è il percorso di installazione/aggiornamento per plugin npm di terze parti o ClawHub.

Usa `--repair` quando un'installazione pacchettizzata segnala dipendenze runtime incluse mancanti durante l'avvio del Gateway o `plugins doctor`. La riparazione installa solo le dipendenze mancanti dei plugin inclusi abilitati con gli script del ciclo di vita disabilitati. Usa `--prune` per rimuovere radici di dipendenze runtime esterne sconosciute e obsolete lasciate da layout pacchettizzati precedenti.

Per il piano completo, lo staging e il ciclo di vita della riparazione, vedi [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution).

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record dei plugin da `plugins.entries`, l'indice persistente dei plugin, le voci delle liste allow/deny dei plugin e le voci collegate di `plugins.load.paths` quando applicabile. A meno che `--keep-files` sia impostato, la disinstallazione rimuove anche la directory di installazione gestita tracciata quando si trova nella radice delle estensioni plugin di OpenClaw. Per i plugin di active memory, lo slot di memoria viene reimpostato su `memory-core`.

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

Gli aggiornamenti si applicano alle installazioni plugin tracciate nell'indice dei plugin gestiti e alle installazioni hook-pack tracciate in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Risoluzione dell'id plugin rispetto alla spec npm">
    Quando passi un id plugin, OpenClaw riutilizza la spec di installazione registrata per quel plugin. Questo significa che i dist-tag memorizzati in precedenza, come `@beta`, e le versioni esatte fissate continuano a essere usati nelle successive esecuzioni di `update <id>`.

    Per le installazioni npm, puoi anche passare una spec di pacchetto npm esplicita con un dist-tag o una versione esatta. OpenClaw risolve quel nome di pacchetto tornando al record plugin tracciato, aggiorna quel plugin installato e registra la nuova spec npm per futuri aggiornamenti basati su id.

    Passare il nome del pacchetto npm senza versione o tag risolve anch'esso verso il record plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registro.

  </Accordion>
  <Accordion title="Controlli di versione e deriva dell'integrità">
    Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registro npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già al target risolto, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

    Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo considera deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modo chiuso a meno che il chiamante fornisca una policy di continuazione esplicita.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install durante l'aggiornamento">
    `--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come override di emergenza per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei plugin. Continua a non bypassare i blocchi di policy `before_install` dei plugin né il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti hook-pack.
  </Accordion>
</AccordionGroup>

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect mostra identità, stato di caricamento, origine, capacità del manifesto, flag di policy, diagnostica, metadati di installazione, capacità del bundle e qualsiasi supporto rilevato per server MCP o LSP senza importare di default il runtime del plugin. Aggiungi `--runtime` per caricare il modulo plugin e includere hook, strumenti, comandi, servizi, metodi Gateway e route HTTP registrati. L'ispezione runtime fallisce con un suggerimento di riparazione quando mancano dipendenze runtime incluse; usa `openclaw plugins deps --repair` per ripararle esplicitamente.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capacità (ad esempio un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello di capacità.

<Note>
Il flag `--json` produce un report leggibile dalla macchina adatto per scripting e audit. `inspect --all` renderizza una tabella a livello di parco con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e riepilogo degli hook. `info` è un alias di `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifesto/rilevamento e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Per errori di forma del modulo come export `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma degli export nell'output diagnostico.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei plugin è il modello di lettura a freddo persistente di OpenClaw per identità dei plugin, abilitazione, metadati di origine e proprietà dei contributi. Avvio normale, ricerca del proprietario provider, classificazione della configurazione del canale e inventario dei plugin possono leggerlo senza importare moduli runtime dei plugin.

Usa `plugins registry` per ispezionare se il registro persistente è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dall'indice persistente dei plugin, dalla policy di configurazione e dai metadati di manifesto/pacchetto. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è uno switch di compatibilità di emergenza deprecato per fallimenti di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il recupero di emergenza dell'avvio mentre la migrazione viene distribuita.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accetta un percorso marketplace locale, un percorso `marketplace.json`, una scorciatoia GitHub come `owner/repo`, un URL repo GitHub o un URL git. `--json` stampa l'etichetta sorgente risolta più il manifesto marketplace analizzato e le voci plugin.

## Correlati

- [Creazione di plugin](/it/plugins/building-plugins)
- [Riferimento CLI](/it/cli)
- [Plugin della community](/it/plugins/community)
