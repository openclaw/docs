---
read_when:
    - Vuoi installare o gestire plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug degli errori di caricamento dei plugin
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: plugin
x-i18n:
    generated_at: "2026-04-05T13:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestisci plugin/estensioni Gateway, pacchetti di hook e bundle compatibili.

Correlati:

- Sistema di plugin: [Plugin](/tools/plugin)
- Compatibilità dei bundle: [Bundle di plugin](/plugins/bundles)
- Manifest del plugin + schema: [Manifest del plugin](/plugins/manifest)
- Rafforzamento della sicurezza: [Sicurezza](/gateway/security)

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
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

I plugin inclusi vengono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio i provider di modelli inclusi, i provider vocali inclusi e il plugin browser incluso); altri richiedono `plugins enable`.

I plugin nativi di OpenClaw devono includere `openclaw.plugin.json` con uno schema JSON inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest di bundle.

`plugins list` mostra `Format: openclaw` o `Format: bundle`. L'output dettagliato di list/info mostra anche il sottotipo di bundle (`codex`, `claude` o `cursor`) oltre alle capacità del bundle rilevate.

### Installazione

```bash
openclaw plugins install <package>                      # ClawHub prima, poi npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sovrascrive un'installazione esistente
openclaw plugins install <package> --pin                # blocca la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

I nomi di pacchetto senza prefisso vengono controllati prima su ClawHub, poi su npm. Nota di sicurezza: considera le installazioni di plugin come esecuzione di codice. Preferisci versioni bloccate.

Se la configurazione non è valida, `plugins install` normalmente fallisce in modo sicuro e ti dice di eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso di ripristino ristretto per plugin inclusi che optano esplicitamente per `openclaw.install.allowInvalidConfigRecovery`.

`--force` riutilizza la destinazione di installazione esistente e sovrascrive sul posto un plugin o un pacchetto di hook già installato. Usalo quando stai intenzionalmente reinstallando lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm.

`--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`, perché le installazioni dal marketplace persistono i metadati della sorgente del marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un'opzione di emergenza per i falsi positivi nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche quando lo scanner integrato segnala risultati `critical`, ma **non** aggira i blocchi delle policy degli hook `before_install` del plugin e **non** aggira gli errori di scansione.

Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni delle dipendenze delle Skills supportate dal Gateway usano la corrispondente sostituzione della richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane un flusso separato di download/installazione di Skills da ClawHub.

`plugins install` è anche la superficie di installazione per i pacchetti di hook che espongono `openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei pacchetti.

Le specifiche npm sono **solo registry** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Per sicurezza, le installazioni delle dipendenze vengono eseguite con `--ignore-scripts`.

Le specifiche senza prefisso e `@latest` restano sul canale stabile. Se npm risolve una di queste in una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come `@1.2.3-beta.4`.

Se una specifica di installazione senza prefisso corrisponde a un id di plugin incluso (ad esempio `diffs`), OpenClaw installa direttamente il plugin incluso. Per installare un pacchetto npm con lo stesso nome, usa una specifica con scope esplicito (ad esempio `@scope/diffs`).

Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Sono supportate anche le installazioni dal marketplace di Claude.

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le specifiche di plugin senza prefisso compatibili con npm. Ripiega su npm solo se ClawHub non dispone di quel pacchetto o di quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, controlla l'API del plugin pubblicizzata / la compatibilità minima del gateway, quindi lo installa tramite il normale percorso di archivio. Le installazioni registrate mantengono i metadati della sorgente ClawHub per aggiornamenti successivi.

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

Le sorgenti del marketplace possono essere:

- un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
- una root locale del marketplace o un percorso `marketplace.json`
- una forma abbreviata di repository GitHub come `owner/repo`
- un URL di repository GitHub come `https://github.com/owner/repo`
- un URL git

Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono rimanere all'interno del repository del marketplace clonato. OpenClaw accetta sorgenti di percorso relativo da quel repository e rifiuta sorgenti di plugin HTTP(S), con percorso assoluto, git, GitHub e altre sorgenti non basate su percorso provenienti da manifest remoti.

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- plugin nativi di OpenClaw (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

I bundle compatibili vengono installati nella normale root delle estensioni e partecipano allo stesso flusso list/info/enable/disable. Al momento sono supportati le Skills dei bundle, le command-skills di Claude, i valori predefiniti di Claude `settings.json`, i valori predefiniti di Claude `.lsp.json` / `lspServers` dichiarati nel manifest, le command-skills di Cursor e le directory di hook Codex compatibili; altre capacità di bundle rilevate vengono mostrate in diagnostics/info ma non sono ancora collegate all'esecuzione runtime.

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` per mostrare solo i plugin caricati. Usa `--verbose` per passare dalla vista tabellare a righe di dettaglio per plugin con metadati di sorgente/origine/versione/attivazione. Usa `--json` per un inventario leggibile dalle macchine più diagnostica del registro.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` non è supportato con `--link` perché le installazioni collegate riutilizzano il percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) in `plugins.installs`, mantenendo però il comportamento predefinito non bloccato.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del plugin da `plugins.entries`, `plugins.installs`, dalla allowlist dei plugin e dalle voci collegate di `plugins.load.paths` quando applicabile. Per i plugin di memoria attivi, lo slot di memoria viene reimpostato a `memory-core`.

Per impostazione predefinita, la disinstallazione rimuove anche la directory di installazione del plugin sotto la root dei plugin della directory di stato attiva. Usa `--keep-files` per mantenere i file sul disco.

`--keep-config` è supportato come alias deprecato di `--keep-files`.

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni tracciate in `plugins.installs` e alle installazioni tracciate dei pacchetti di hook in `hooks.internal.installs`.

Quando passi un id plugin, OpenClaw riutilizza la specifica di installazione registrata per quel plugin. Questo significa che i dist-tag memorizzati in precedenza, come `@beta`, e le versioni esatte bloccate continuano a essere usati nelle esecuzioni successive di `update <id>`.

Per le installazioni npm, puoi anche passare una specifica esplicita di pacchetto npm con un dist-tag o una versione esatta. OpenClaw riconduce quel nome di pacchetto al record del plugin tracciato, aggiorna il plugin installato e registra la nuova specifica npm per futuri aggiornamenti basati su id.

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa il flag globale `--yes` per bypassare i prompt nelle esecuzioni CI/non interattive.

`--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come sostituzione di emergenza per falsi positivi della scansione integrata di codice pericoloso durante gli aggiornamenti dei plugin. Continua a non aggirare i blocchi delle policy `before_install` del plugin o il blocco per errori di scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti dei pacchetti di hook.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Ispezione approfondita di un singolo plugin. Mostra identità, stato di caricamento, sorgente, capacità registrate, hook, strumenti, comandi, servizi, metodi gateway, route HTTP, flag di policy, diagnostica, metadati di installazione, capacità del bundle ed eventuale supporto MCP o server LSP rilevato.

Ogni plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capacità (ad esempio un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, senza capacità o superfici
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei plugin](/plugins/architecture#plugin-shapes) per ulteriori informazioni sul modello di capacità.

Il flag `--json` produce un report leggibile dalle macchine adatto per script e audit.

`inspect --all` visualizza una tabella dell'intera flotta con colonne per forma, tipi di capacità, avvisi di compatibilità, capacità dei bundle e riepilogo degli hook.

`info` è un alias di `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accetta un percorso locale del marketplace, un percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repository GitHub o un URL git. `--json` stampa l'etichetta della sorgente risolta insieme al manifest del marketplace analizzato e alle voci dei plugin.
