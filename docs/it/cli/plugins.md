---
read_when:
    - Vuoi installare o gestire Plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento del Plugin
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-25T18:18:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestisci i Plugin Gateway, i pacchetti hook e i bundle compatibili.

Correlati:

- Sistema Plugin: [Plugin](/it/tools/plugin)
- Compatibilità dei bundle: [Bundle Plugin](/it/plugins/bundles)
- Manifest Plugin + schema: [Manifest Plugin](/it/plugins/manifest)
- Rafforzamento della sicurezza: [Sicurezza](/it/gateway/security)

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

I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il Plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno Schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` oppure `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo di bundle (`codex`, `claude` o `cursor`) più le capacità del bundle rilevate.

### Installazione

```bash
openclaw plugins install <package>                      # prima ClawHub, poi npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sovrascrive un'installazione esistente
openclaw plugins install <package> --pin                # blocca la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

I nomi di pacchetto senza qualificatori vengono controllati prima in ClawHub, poi in npm. Nota di sicurezza: considera le installazioni di Plugin come esecuzione di codice. Preferisci versioni bloccate.

Se la tua sezione `plugins` è supportata da un singolo file `$include`, `plugins install/update/enable/disable/uninstall` scrivono in quel file incluso e lasciano invariato `openclaw.json`. Gli include radice, gli array di include e gli include con override fratelli falliscono in modalità chiusa invece di essere appiattiti. Vedi [Include di configurazione](/it/gateway/configuration) per le forme supportate.

Se la configurazione non è valida, `plugins install` normalmente fallisce in modalità chiusa e ti dice di eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso di recupero ristretto per Plugin inclusi che si attivano esplicitamente con `openclaw.install.allowInvalidConfigRecovery`.

`--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un Plugin o un pacchetto hook già installato. Usalo quando stai intenzionalmente reinstallando lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per gli aggiornamenti ordinari di un Plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

Se esegui `plugins install` per un id Plugin già installato, OpenClaw si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

`--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace persistono i metadati della sorgente del marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è un'opzione di emergenza per i falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi di policy degli hook `before_install` dei Plugin e **non** aggira i fallimenti della scansione.

Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni delle dipendenze delle Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta un flusso separato di download/installazione delle Skills da ClawHub.

`plugins install` è anche la superficie di installazione per i pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione del pacchetto.

Le spec npm sono **solo registry** (nome del pacchetto + **versione esatta** opzionale oppure **dist-tag**). Le spec Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le spec senza qualificatori e `@latest` restano sul canale stabile. Se npm risolve uno di questi in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

Se una spec di installazione senza qualificatori corrisponde a un id di Plugin incluso (ad esempio `diffs`), OpenClaw installa direttamente il Plugin incluso. Per installare un pacchetto npm con lo stesso nome, usa una spec scoped esplicita (ad esempio `@scope/diffs`).

Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Sono supportate anche le installazioni dal marketplace Claude.

Le installazioni da ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le spec Plugin npm-safe senza qualificatori. Passa a npm solo se ClawHub non dispone di quel pacchetto o di quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, controlla l'API Plugin pubblicizzata / la compatibilità minima del gateway, quindi lo installa tramite il normale percorso degli archivi. Le installazioni registrate mantengono i metadati della sorgente ClawHub per aggiornamenti successivi.

Usa la forma abbreviata `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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

Le sorgenti marketplace possono essere:

- un nome marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
- una radice marketplace locale o un percorso `marketplace.json`
- una forma abbreviata di repository GitHub come `owner/repo`
- un URL di repository GitHub come `https://github.com/owner/repo`
- un URL git

Per i marketplace remoti caricati da GitHub o git, le voci dei Plugin devono restare all'interno del repository marketplace clonato. OpenClaw accetta sorgenti a percorso relativo da quel repository e rifiuta sorgenti Plugin HTTP(S), a percorso assoluto, git, GitHub e altre sorgenti non basate su percorsi provenienti da manifest remoti.

Per i percorsi locali e gli archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout di componenti Claude predefinito)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

I bundle compatibili vengono installati nella normale radice dei Plugin e partecipano allo stesso flusso di list/info/enable/disable. Attualmente sono supportati le Skills dei bundle, le command-skills di Claude, i valori predefiniti `settings.json` di Claude, i valori predefiniti `.lsp.json` / `lspServers` dichiarati dal manifest, le command-skills di Cursor e le directory hook compatibili con Codex; altre capacità di bundle rilevate vengono mostrate in diagnostics/info ma non sono ancora collegate all'esecuzione runtime.

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` per mostrare solo i Plugin abilitati. Usa `--verbose` per passare dalla vista tabellare a righe di dettaglio per Plugin con metadati di sorgente/origine/versione/attivazione. Usa `--json` per un inventario leggibile dalle macchine più le diagnostiche del registro.

`plugins list` legge prima il registro locale persistente dei Plugin, con un fallback derivato solo dal manifest quando il registro manca o non è valido. È utile per verificare se un Plugin è installato, abilitato e visibile alla pianificazione di avvio a freddo, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato il codice di un Plugin, la sua abilitazione, la policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti che vengano eseguiti nuovo codice `register(api)` o hook. Per i deployment remoti/in container, verifica di stare riavviando l'effettivo processo figlio `openclaw gateway run`, non solo un processo wrapper.

Per il debug degli hook runtime:

- `openclaw plugins inspect <id> --json` mostra gli hook registrati e le diagnostiche da un passaggio di ispezione con modulo caricato.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, gli indizi su servizio/processo, il percorso della configurazione e lo stato di integrità RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (la aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la spec esatta risolta (`name@version`) in `plugins.installs`, mantenendo però il comportamento predefinito non bloccato.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del Plugin da `plugins.entries`, `plugins.installs`, dalla allowlist dei Plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. Per i Plugin di memoria attiva, lo slot memoria viene reimpostato a `memory-core`.

Per impostazione predefinita, la disinstallazione rimuove anche la directory di installazione del Plugin sotto la radice Plugin della directory di stato attiva. Usa `--keep-files` per mantenere i file su disco.

`--keep-config` è supportato come alias deprecato di `--keep-files`.

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni tracciate in `plugins.installs` e alle installazioni tracciate dei pacchetti hook in `hooks.internal.installs`.

Quando passi un id Plugin, OpenClaw riutilizza la spec di installazione registrata per quel Plugin. Ciò significa che i dist-tag memorizzati in precedenza, come `@beta`, e le versioni esatte bloccate continuano a essere usati nelle successive esecuzioni di `update <id>`.

Per le installazioni npm, puoi anche passare una spec esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw riconduce il nome di quel pacchetto al record del Plugin tracciato, aggiorna quel Plugin installato e registra la nuova spec npm per futuri aggiornamenti basati su id.

Anche passare il nome del pacchetto npm senza versione o tag viene ricondotto al record del Plugin tracciato. Usalo quando un Plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registry.

Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registry npm. Se la versione installata e l'identità dell'artefatto registrata corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw tratta il caso come una deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash atteso ed effettivo e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modalità chiusa a meno che il chiamante non fornisca una policy esplicita per continuare.

`--dangerously-force-unsafe-install` è disponibile anche in `plugins update` come override di emergenza per i falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei Plugin. Continua comunque a non aggirare i blocchi di policy `before_install` dei Plugin o il blocco dovuto a errori di scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti dei pacchetti hook.

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita per un singolo Plugin. Mostra identità, stato di caricamento, sorgente, capacità registrate, hook, strumenti, comandi, servizi, metodi gateway, route HTTP, flag di policy, diagnostiche, metadati di installazione, capacità del bundle e qualsiasi supporto MCP o server LSP rilevato.

Ogni Plugin viene classificato in base a ciò che registra effettivamente in fase di runtime:

- **plain-capability** — un solo tipo di capacità (ad esempio un Plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori dettagli sul modello di capacità.

Il flag `--json` produce un report leggibile dalle macchine adatto per scripting e auditing.

`inspect --all` visualizza una tabella estesa all'intera flotta con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e riepilogo degli hook.

`info` è un alias di `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` riporta errori di caricamento dei Plugin, diagnostiche di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

Per errori di forma del modulo come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere nell'output diagnostico un riepilogo compatto della forma delle esportazioni.

### Registro

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Il registro locale dei Plugin è il modello di lettura persistito a freddo di OpenClaw per identità del Plugin installato, abilitazione, metadati della sorgente e proprietà dei contributi. L'avvio normale, la ricerca del proprietario del provider, la classificazione della configurazione del canale e l'inventario dei Plugin possono leggerlo senza importare i moduli runtime dei Plugin.

Usa `plugins registry` per verificare se il registro persistito è presente, aggiornato o obsoleto. Usa `--refresh` per ricostruirlo dal ledger di installazione durevole, dalla policy di configurazione e dai metadati di manifest/package. Questo è un percorso di riparazione, non un percorso di attivazione runtime.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` è un interruttore di compatibilità deprecato di emergenza per errori di lettura del registro. Preferisci `plugins registry --refresh` o `openclaw doctor --fix`; il fallback env è solo per il recupero di emergenza all'avvio durante il rollout della migrazione.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del marketplace accetta un percorso marketplace locale, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta insieme al manifest marketplace analizzato e alle voci dei Plugin.

## Correlati

- [Riferimento CLI](/it/cli)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
