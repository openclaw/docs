---
read_when:
    - Vuoi installare o gestire Plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug di errori di caricamento dei Plugin
summary: Riferimento CLI per `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugin
x-i18n:
    generated_at: "2026-04-24T08:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestisci Plugin Gateway, pacchetti hook e bundle compatibili.

Correlati:

- Sistema Plugin: [Plugin](/it/tools/plugin)
- Compatibilità bundle: [Bundle Plugin](/it/plugins/bundles)
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

I Plugin bundle sono inclusi con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio
provider di modelli bundle, provider vocali bundle e il Plugin browser
bundle); altri richiedono `plugins enable`.

I Plugin OpenClaw nativi devono includere `openclaw.plugin.json` con uno JSON
Schema inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri manifest bundle.

`plugins list` mostra `Format: openclaw` oppure `Format: bundle`. L'output dettagliato di list/info
mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle
rilevate.

### Installazione

```bash
openclaw plugins install <package>                      # prima ClawHub, poi npm
openclaw plugins install clawhub:<package>              # solo ClawHub
openclaw plugins install <package> --force              # sovrascrive l'installazione esistente
openclaw plugins install <package> --pin                # fissa la versione
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # percorso locale
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (esplicito)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

I nomi pacchetto non qualificati vengono controllati prima in ClawHub, poi in npm. Nota di sicurezza:
tratta le installazioni di Plugin come esecuzione di codice. Preferisci versioni fissate.

Se la tua sezione `plugins` è supportata da un singolo `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrivono in quel file incluso e lasciano `openclaw.json` invariato. Include root, array di include e include con override sibling falliscono in modalità fail-closed invece di appiattirsi. Vedi [Config includes](/it/gateway/configuration) per le forme supportate.

Se la configurazione non è valida, `plugins install` normalmente fallisce in modalità fail-closed e ti dice di
eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso ristretto
di recupero dei Plugin bundle per Plugin che scelgono esplicitamente
`openclaw.install.allowInvalidConfigRecovery`.

`--force` riusa la destinazione di installazione esistente e sovrascrive sul posto un
Plugin o pacchetto hook già installato. Usalo quando stai intenzionalmente reinstallando
lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artefatto npm.
Per aggiornamenti ordinari di un Plugin npm già tracciato, preferisci
`openclaw plugins update <id-or-npm-spec>`.

Se esegui `plugins install` per un id Plugin già installato, OpenClaw
si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un normale aggiornamento,
oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere
l'installazione corrente da una sorgente diversa.

`--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`,
perché le installazioni marketplace persistono metadati della sorgente marketplace invece di una
specifica npm.

`--dangerously-force-unsafe-install` è un'opzione break-glass per i falsi positivi
nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche
quando lo scanner integrato riporta risultati `critical`, ma **non**
aggira i blocchi di policy degli hook Plugin `before_install` e **non** aggira i
fallimenti della scansione.

Questo flag CLI si applica ai flussi di installazione/aggiornamento dei Plugin. Le installazioni di dipendenze delle skill
supportate da Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta un flusso separato di
download/installazione delle skill da ClawHub.

`plugins install` è anche la superficie di installazione per i pacchetti hook che espongono
`openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la
visibilità filtrata degli hook e l'abilitazione per singolo hook, non per l'installazione dei package.

Le specifiche npm sono **solo registry** (nome pacchetto + **versione esatta** facoltativa o
**dist-tag**). Le specifiche Git/URL/file e gli intervalli semver sono rifiutati. Le
installazioni delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche non qualificate e `@latest` restano sul canale stabile. Se npm risolve
una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un
tag prerelease come `@beta`/`@rc` o una versione prerelease esatta come
`@1.2.3-beta.4`.

Se una specifica di installazione non qualificata corrisponde a un id Plugin bundle (ad esempio `diffs`), OpenClaw
installa direttamente il Plugin bundle. Per installare un package npm con lo stesso
nome, usa una specifica con scope esplicita (ad esempio `@scope/diffs`).

Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Sono supportate anche le installazioni dal marketplace Claude.

Le installazioni ClawHub usano un locator esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per specifiche Plugin non qualificate sicure per npm. Ripiega
su npm solo se ClawHub non ha quel package o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del package da ClawHub, controlla la compatibilità
pubblicizzata dell'API Plugin / gateway minimo, poi lo installa tramite il normale
percorso archivio. Le installazioni registrate mantengono i propri metadati della sorgente ClawHub per aggiornamenti successivi.

Usa la forma abbreviata `plugin@marketplace` quando il nome del marketplace esiste nella cache del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Usa `--marketplace` quando vuoi passare esplicitamente la sorgente marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Le sorgenti marketplace possono essere:

- un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
- una root marketplace locale o un percorso `marketplace.json`
- una forma abbreviata repo GitHub come `owner/repo`
- un URL repo GitHub come `https://github.com/owner/repo`
- un URL git

Per marketplace remoti caricati da GitHub o git, le voci Plugin devono restare
all'interno del repo marketplace clonato. OpenClaw accetta sorgenti di percorso relative da
quel repo e rifiuta sorgenti Plugin HTTP(S), a percorso assoluto, git, GitHub e altre sorgenti non-path dai manifest remoti.

Per percorsi locali e archivi, OpenClaw rileva automaticamente:

- Plugin OpenClaw nativi (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout componenti
  predefinito di Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

I bundle compatibili vengono installati nella normale root Plugin e partecipano
allo stesso flusso list/info/enable/disable. Oggi, le skill dei bundle, le
command-skills Claude, i valori predefiniti Claude `settings.json`, i valori predefiniti Claude `.lsp.json` /
`lspServers` dichiarati dal manifest, le command-skills Cursor e le directory hook Codex compatibili sono supportati; altre capacità di bundle rilevate vengono
mostrate in diagnostics/info ma non sono ancora collegate all'esecuzione runtime.

### Elenco

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` per mostrare solo i Plugin caricati. Usa `--verbose` per passare dalla
vista tabellare a righe di dettaglio per Plugin con metadati di sorgente/origine/versione/attivazione. Usa `--json` per un inventario leggibile dalla macchina più
diagnostica del registro.

Usa `--link` per evitare di copiare una directory locale (aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` non è supportato con `--link` perché le installazioni collegate riusano il
percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` nelle installazioni npm per salvare la specifica esatta risolta (`name@version`) in
`plugins.installs` mantenendo il comportamento predefinito non fissato.

### Disinstallazione

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record Plugin da `plugins.entries`, `plugins.installs`,
dalla allowlist dei Plugin e dalle voci collegate `plugins.load.paths` quando applicabile.
Per i Plugin Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

Per impostazione predefinita, la disinstallazione rimuove anche la directory di installazione del Plugin sotto la
root Plugin della state-dir attiva. Usa
`--keep-files` per mantenere i file su disco.

`--keep-config` è supportato come alias deprecato per `--keep-files`.

### Aggiornamento

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni tracciate in `plugins.installs` e alle installazioni tracciate dei pacchetti hook in `hooks.internal.installs`.

Quando passi un id Plugin, OpenClaw riusa la specifica di installazione registrata per quel
Plugin. Questo significa che dist-tag precedentemente memorizzati come `@beta` e versioni esatte fissate continuano a essere usati nelle esecuzioni successive di `update <id>`.

Per le installazioni npm, puoi anche passare una specifica esplicita del package npm con un dist-tag
o una versione esatta. OpenClaw risolve quel nome package riportandolo al record Plugin tracciato, aggiorna quel Plugin installato e registra la nuova specifica npm per futuri
aggiornamenti basati sull'id.

Passare il nome del package npm senza versione o tag lo risolve comunque tornando al
record Plugin tracciato. Usalo quando un Plugin era fissato a una versione esatta e
vuoi riportarlo alla linea di rilascio predefinita del registry.

Prima di un aggiornamento npm live, OpenClaw controlla la versione del package installato rispetto ai metadati del registry npm. Se la versione installata e l'identità dell'artefatto registrato
corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza
scaricare, reinstallare o riscrivere `openclaw.json`.

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia,
OpenClaw lo tratta come drift dell'artefatto npm. Il comando interattivo
`openclaw plugins update` stampa gli hash atteso ed effettivo e chiede
conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modalità fail-closed
a meno che il chiamante non fornisca una policy di continuazione esplicita.

`--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come
override break-glass per falsi positivi della scansione integrata di codice pericoloso durante
gli aggiornamenti dei Plugin. Non aggira comunque i blocchi di policy `before_install` del Plugin
o il blocco per fallimento della scansione, e si applica solo agli aggiornamenti dei Plugin, non agli aggiornamenti dei pacchetti hook.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita per un singolo Plugin. Mostra identità, stato di caricamento, sorgente,
capacità registrate, hook, strumenti, comandi, servizi, metodi Gateway,
route HTTP, flag di policy, diagnostica, metadati di installazione, capacità del bundle
ed eventuale supporto MCP o server LSP rilevato.

Ogni Plugin è classificato in base a ciò che registra effettivamente a runtime:

- **plain-capability** — un tipo di capacità (ad esempio un Plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei Plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello di capacità.

Il flag `--json` produce un report leggibile dalla macchina adatto per scripting e
audit.

`inspect --all` mostra una tabella dell'intera flotta con colonne per forma, tipi di capacità,
avvisi di compatibilità, capacità del bundle e riepilogo hook.

`info` è un alias di `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` riporta errori di caricamento dei Plugin, diagnostica del manifest/rilevamento e
avvisi di compatibilità. Quando tutto è pulito stampa `No plugin issues
detected.`

Per errori di forma del modulo come esportazioni `register`/`activate` mancanti, riesegui
con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni
nell'output diagnostico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accetta un percorso marketplace locale, un percorso `marketplace.json`, una
forma abbreviata GitHub come `owner/repo`, un URL repo GitHub oppure un URL git. `--json`
stampa l'etichetta della sorgente risolta più il manifest marketplace analizzato e le
voci Plugin.

## Correlati

- [Riferimento CLI](/it/cli)
- [Creazione di Plugin](/it/plugins/building-plugins)
- [Plugin della community](/it/plugins/community)
