---
read_when:
    - Vuoi installare o gestire Plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento del Plugin
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-24T15:23:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestisci Plugin Gateway, pacchetti hook e bundle compatibili.

Correlati:

- Sistema Plugin: [Plugin](/it/tools/plugin)
- Compatibilità dei bundle: [Bundle Plugin](/it/plugins/bundles)
- Manifest Plugin + schema: [Manifest Plugin](/it/plugins/manifest)
- Hardening della sicurezza: [Sicurezza](/it/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

I Plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (per esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` oppure `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo di bundle (`codex`, `claude` o `cursor`) oltre alle funzionalità del bundle rilevate.

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

I nomi di pacchetto semplici vengono controllati prima in ClawHub, poi in npm. Nota di sicurezza: considera l'installazione dei plugin come esecuzione di codice. Preferisci versioni bloccate.

Se la sezione `plugins` è supportata da un singolo `$include` in un file, `plugins install/update/enable/disable/uninstall` scrive in quel file incluso e lascia invariato `openclaw.json`. Gli include radice, gli array di include e gli include con override affiancati falliscono in modalità chiusa invece di essere appiattiti. Consulta [Config includes](/it/gateway/configuration) per le forme supportate.

Se la configurazione non è valida, `plugins install` normalmente fallisce in modalità chiusa e ti indica di eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso ristretto di recupero per plugin inclusi che scelgono esplicitamente `openclaw.install.allowInvalidConfigRecovery`.

`--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o un pacchetto hook già installato. Usalo quando vuoi intenzionalmente reinstallare lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm. Per aggiornamenti ordinari di un plugin npm già tracciato, preferisci `openclaw plugins update <id-or-npm-spec>`.

Se esegui `plugins install` per un id plugin già installato, OpenClaw si interrompe e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale, oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere l'installazione corrente da una sorgente diversa.

`--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni da marketplace salvano i metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un'opzione di emergenza per i falsi positivi nel rilevatore integrato di codice pericoloso. Consente all'installazione di proseguire anche quando il rilevatore integrato riporta risultati `critical`, ma **non** aggira i blocchi di policy degli hook `before_install` del plugin e **non** aggira i fallimenti della scansione.

Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni delle dipendenze delle Skills supportate da Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta un flusso separato di download/installazione di Skills da ClawHub.

`plugins install` è anche la superficie di installazione per i pacchetti hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione del pacchetto.

Le specifiche npm sono **solo registry** (nome pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche semplici e `@latest` restano sul canale stabile. Se npm risolve una di queste in una prerelease, OpenClaw si interrompe e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` oppure con una versione prerelease esatta come `@1.2.3-beta.4`.

Se una specifica di installazione semplice corrisponde all'id di un plugin incluso (per esempio `diffs`), OpenClaw installa direttamente il plugin incluso. Per installare un pacchetto npm con lo stesso nome, usa una specifica scoped esplicita (per esempio `@scope/diffs`).

Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Sono supportate anche le installazioni dal marketplace Claude.

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le specifiche di plugin semplici sicure per npm. Passa a npm solo se ClawHub non dispone di quel pacchetto o di quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, controlla la compatibilità dichiarata dell'API plugin / versione minima del gateway, quindi lo installa tramite il normale percorso per archivi. Le installazioni registrate mantengono i metadati della sorgente ClawHub per gli aggiornamenti successivi.

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

- un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
- una radice di marketplace locale o un percorso `marketplace.json`
- una forma abbreviata di repo GitHub come `owner/repo`
- un URL di repo GitHub come `https://github.com/owner/repo`
- un URL git

Per i marketplace remoti caricati da GitHub o git, le voci plugin devono restare all'interno del repo marketplace clonato. OpenClaw accetta sorgenti con percorso relativo da quel repo e rifiuta sorgenti plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso provenienti da manifest remoti.

Per i percorsi locali e gli archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

I bundle compatibili vengono installati nella normale radice dei plugin e partecipano allo stesso flusso list/info/enable/disable. Attualmente sono supportati bundle Skills, Claude command-skills, valori predefiniti Claude `settings.json`, valori predefiniti Claude `.lsp.json` / `lspServers` dichiarati nel manifest, Cursor command-skills e directory hook Codex compatibili; altre funzionalità di bundle rilevate vengono mostrate nella diagnostica/info ma non sono ancora collegate all'esecuzione runtime.

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` per mostrare solo i plugin caricati. Usa `--verbose` per passare dalla vista tabella a righe di dettaglio per plugin con metadati di sorgente/origine/versione/attivazione. Usa `--json` per un inventario leggibile dalle macchine con diagnostica del registro.

`plugins list` esegue il rilevamento dall'ambiente CLI e dalla configurazione correnti. È utile per verificare se un plugin è abilitato/caricabile, ma non è una sonda runtime live di un processo Gateway già in esecuzione. Dopo aver modificato il codice del plugin, l'abilitazione, la policy degli hook o `plugins.load.paths`, riavvia il Gateway che serve il canale prima di aspettarti l'esecuzione del nuovo codice `register(api)` o degli hook. Per i deployment remoti/in container, verifica di riavviare il vero processo figlio `openclaw gateway run`, non solo un processo wrapper.

Per il debug runtime degli hook:

- `openclaw plugins inspect <id> --json` mostra gli hook registrati e la diagnostica da un passaggio di ispezione con modulo caricato.
- `openclaw gateway status --deep --require-rpc` conferma il Gateway raggiungibile, gli indizi sul servizio/processo, il percorso di configurazione e lo stato RPC.
- Gli hook di conversazione non inclusi (`llm_input`, `llm_output`, `agent_end`) richiedono `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare in `plugins.installs` la specifica esatta risolta (`name@version`), mantenendo comunque il comportamento predefinito non bloccato.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del plugin da `plugins.entries`, `plugins.installs`, dalla allowlist dei plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. Per i plugin Active Memory, lo slot di memoria viene reimpostato a `memory-core`.

Per impostazione predefinita, uninstall rimuove anche la directory di installazione del plugin sotto la radice plugin della state-dir attiva. Usa `--keep-files` per mantenere i file su disco.

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

Quando passi un id plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Questo significa che i dist-tag salvati in precedenza come `@beta` e le versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

Per le installazioni npm, puoi anche passare una specifica esplicita del pacchetto npm con un dist-tag o una versione esatta. OpenClaw risolve quel nome pacchetto tornando al record del plugin tracciato, aggiorna il plugin installato e registra la nuova specifica npm per i futuri aggiornamenti basati su id.

Passare il nome del pacchetto npm senza versione o tag risolve comunque il record del plugin tracciato. Usalo quando un plugin era bloccato a una versione esatta e vuoi riportarlo alla linea di rilascio predefinita del registry.

Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto ai metadati del registry npm. Se la versione installata e l'identità dell'artefatto registrato corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza scaricare, reinstallare o riscrivere `openclaw.json`.

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw lo tratta come deriva dell'artefatto npm. Il comando interattivo `openclaw plugins update` stampa gli hash previsti ed effettivi e chiede conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modalità chiusa, a meno che il chiamante non fornisca una policy esplicita di continuazione.

`--dangerously-force-unsafe-install` è disponibile anche in `plugins update` come override di emergenza per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei plugin. Continua comunque a non aggirare i blocchi di policy `before_install` del plugin né il blocco dovuto a fallimenti della scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti dei pacchetti hook.

### Ispezione

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita per un singolo plugin. Mostra identità, stato di caricamento, origine, capacità registrate, hook, strumenti, comandi, servizi, metodi gateway, route HTTP, flag di policy, diagnostica, metadati di installazione, capacità del bundle ed eventuale supporto MCP o server LSP rilevato.

Ogni plugin è classificato in base a ciò che registra effettivamente in fase di esecuzione:

- **plain-capability** — un tipo di capacità (ad esempio un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello di capacità.

Il flag `--json` produce un report leggibile dalle macchine adatto per scripting e auditing.

`inspect --all` visualizza una tabella dell'intero parco con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità del bundle e riepilogo degli hook.

`info` è un alias di `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/rilevamento e avvisi di compatibilità. Quando tutto è pulito, stampa `No plugin issues detected.`

Per errori di forma del modulo come esportazioni `register`/`activate` mancanti, riesegui con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni nell'output diagnostico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

L'elenco del marketplace accetta un percorso di marketplace locale, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta insieme al manifest del marketplace analizzato e alle voci del plugin.

## Correlati

- [Riferimento CLI](/it/cli)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
