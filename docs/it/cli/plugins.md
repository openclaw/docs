---
read_when:
    - Vuoi installare o gestire plugin Gateway o bundle compatibili
    - Vuoi eseguire il debug dei fallimenti di caricamento dei plugin
summary: Riferimento CLI per `openclaw plugins` (elencare, installare, marketplace, disinstallare, abilitare/disabilitare, doctor)
title: plugin
x-i18n:
    generated_at: "2026-04-23T08:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469364823c0766f6534c5d7eee963877f98fe23ecfa45251696a34ef65d57599
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gestisci plugin Gateway, pacchetti hook e bundle compatibili.

Correlati:

- Sistema di plugin: [Plugins](/it/tools/plugin)
- Compatibilità dei bundle: [Bundle di plugin](/it/plugins/bundles)
- Manifest del plugin + schema: [Manifest del plugin](/it/plugins/manifest)
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

I plugin inclusi sono distribuiti con OpenClaw. Alcuni sono abilitati per impostazione predefinita (ad esempio
i provider di modelli inclusi, i provider vocali inclusi e il plugin browser
incluso); altri richiedono `plugins enable`.

I plugin nativi OpenClaw devono includere `openclaw.plugin.json` con uno schema JSON
inline (`configSchema`, anche se vuoto). I bundle compatibili usano invece i propri
manifest bundle.

`plugins list` mostra `Format: openclaw` oppure `Format: bundle`. L'output dettagliato di list/info
mostra anche il sottotipo del bundle (`codex`, `claude` o `cursor`) più le capacità del bundle
rilevate.

### Installare

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

I nomi di pacchetto senza qualificatore vengono controllati prima in ClawHub, poi in npm. Nota di sicurezza:
considera l'installazione dei plugin come esecuzione di codice. Preferisci versioni fissate.

Se la tua sezione `plugins` è supportata da un singolo `$include` a file singolo, `plugins install/update/enable/disable/uninstall` scrivono in quel file incluso e lasciano invariato `openclaw.json`. Include root, array di include e include con override sibling falliscono in modalità chiusa invece di appiattirsi. Vedi [Config includes](/it/gateway/configuration) per le forme supportate.

Se la configurazione non è valida, `plugins install` normalmente fallisce in modalità chiusa e indica di
eseguire prima `openclaw doctor --fix`. L'unica eccezione documentata è un percorso ristretto di
ripristino del plugin incluso per i plugin che scelgono esplicitamente
`openclaw.install.allowInvalidConfigRecovery`.

`--force` riusa la destinazione di installazione esistente e sovrascrive sul posto un
plugin o pacchetto hook già installato. Usalo quando stai intenzionalmente reinstallando
lo stesso id da un nuovo percorso locale, archivio, pacchetto ClawHub o artifact npm.
Per gli aggiornamenti ordinari di un plugin npm già tracciato, preferisci
`openclaw plugins update <id-or-npm-spec>`.

Se esegui `plugins install` per un id plugin già installato, OpenClaw
si ferma e ti indirizza a `plugins update <id-or-npm-spec>` per un aggiornamento normale,
oppure a `plugins install <package> --force` quando vuoi davvero sovrascrivere
l'installazione attuale da una fonte diversa.

`--pin` si applica solo alle installazioni npm. Non è supportato con `--marketplace`,
perché le installazioni da marketplace persistono metadati della fonte marketplace invece di una
spec npm.

`--dangerously-force-unsafe-install` è un'opzione di emergenza per falsi positivi
nello scanner integrato di codice pericoloso. Consente all'installazione di continuare anche
quando lo scanner integrato segnala risultati `critical`, ma **non**
aggira i blocchi di policy dell'hook plugin `before_install` e **non** aggira gli errori di scansione.

Questo flag CLI si applica ai flussi di installazione/aggiornamento dei plugin. Le installazioni di dipendenze
delle Skills supportate dal Gateway usano l'override di richiesta corrispondente `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta un flusso separato di
download/installazione di Skills da ClawHub.

`plugins install` è anche la superficie di installazione per i pacchetti hook che espongono
`openclaw.hooks` in `package.json`. Usa `openclaw hooks` per la visibilità filtrata degli hook
e l'abilitazione per-hook, non per l'installazione del pacchetto.

Le spec npm sono **solo registry** (nome pacchetto + **versione esatta** facoltativa oppure
**dist-tag**). Le spec git/URL/file e gli intervalli semver vengono rifiutati. Le
installazioni di dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le spec senza qualificatore e `@latest` restano sul canale stabile. Se npm risolve uno di
questi a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un
tag prerelease come `@beta`/`@rc` oppure una versione prerelease esatta come
`@1.2.3-beta.4`.

Se una spec di installazione senza qualificatore corrisponde a un id di plugin incluso (ad esempio `diffs`), OpenClaw
installa direttamente il plugin incluso. Per installare un pacchetto npm con lo stesso
nome, usa una spec scoped esplicita (ad esempio `@scope/diffs`).

Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Sono supportate anche le installazioni dal marketplace Claude.

Le installazioni ClawHub usano un localizzatore esplicito `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw ora preferisce anche ClawHub per le spec di plugin senza qualificatore sicure per npm. Ripiega
su npm solo se ClawHub non ha quel pacchetto o quella versione:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw scarica l'archivio del pacchetto da ClawHub, verifica la
compatibilità pubblicizzata con l'API plugin / Gateway minimo, poi lo installa tramite il normale
percorso degli archivi. Le installazioni registrate mantengono i metadati della fonte ClawHub per aggiornamenti successivi.

Usa la forma abbreviata `plugin@marketplace` quando il nome del marketplace esiste nella cache
del registro locale di Claude in `~/.claude/plugins/known_marketplaces.json`:

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

Le fonti marketplace possono essere:

- un nome di marketplace noto a Claude da `~/.claude/plugins/known_marketplaces.json`
- una root locale del marketplace o un percorso `marketplace.json`
- una forma abbreviata di repo GitHub come `owner/repo`
- un URL di repo GitHub come `https://github.com/owner/repo`
- un URL git

Per i marketplace remoti caricati da GitHub o git, le voci dei plugin devono restare
all'interno del repo marketplace clonato. OpenClaw accetta fonti di percorso relative da
quel repo e rifiuta fonti plugin HTTP(S), percorso assoluto, git, GitHub e altre fonti non basate su percorso nei manifest remoti.

Per i percorsi locali e gli archivi, OpenClaw rileva automaticamente:

- plugin nativi OpenClaw (`openclaw.plugin.json`)
- bundle compatibili con Codex (`.codex-plugin/plugin.json`)
- bundle compatibili con Claude (`.claude-plugin/plugin.json` o il layout predefinito dei
  componenti Claude)
- bundle compatibili con Cursor (`.cursor-plugin/plugin.json`)

I bundle compatibili vengono installati nella normale root dei plugin e partecipano
allo stesso flusso list/info/enable/disable. Oggi sono supportati Skills dei bundle, Claude
command-skills, valori predefiniti di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` /
`lspServers` dichiarati dal manifest, command-skills Cursor e directory hook Codex compatibili;
altre capacità del bundle rilevate vengono mostrate in diagnostica/info ma non sono ancora collegate all'esecuzione runtime.

### Elencare

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Usa `--enabled` per mostrare solo i plugin caricati. Usa `--verbose` per passare dalla
vista tabellare a righe di dettaglio per plugin con metadati di fonte/origine/versione/attivazione. Usa `--json` per inventario leggibile da macchina più diagnostica del
registro.

Usa `--link` per evitare di copiare una directory locale (la aggiunge a `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` non è supportato con `--link` perché le installazioni collegate riusano il
percorso sorgente invece di copiare sopra una destinazione di installazione gestita.

Usa `--pin` sulle installazioni npm per salvare la spec esatta risolta (`name@version`) in
`plugins.installs`, mantenendo il comportamento predefinito non fissato.

### Disinstallare

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` rimuove i record del plugin da `plugins.entries`, `plugins.installs`,
dalla allowlist dei plugin e dalle voci collegate di `plugins.load.paths` quando applicabile.
Per i plugin Active Memory, lo slot di memoria viene reimpostato su `memory-core`.

Per impostazione predefinita, la disinstallazione rimuove anche la directory di installazione del plugin sotto la
root dei plugin della directory di stato attiva. Usa
`--keep-files` per mantenere i file su disco.

`--keep-config` è supportato come alias deprecato di `--keep-files`.

### Aggiornare

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Gli aggiornamenti si applicano alle installazioni tracciate in `plugins.installs` e alle installazioni tracciate di pacchetti hook in `hooks.internal.installs`.

Quando passi un id plugin, OpenClaw riusa la spec di installazione registrata per quel
plugin. Questo significa che dist-tag memorizzati in precedenza come `@beta` e versioni esatte fissate continuano a essere usati nelle successive esecuzioni di `update <id>`.

Per le installazioni npm, puoi anche passare una spec esplicita di pacchetto npm con un dist-tag
o una versione esatta. OpenClaw risolve quel nome pacchetto tornando al record del plugin tracciato,
aggiorna quel plugin installato e registra la nuova spec npm per futuri
aggiornamenti basati su id.

Passare il nome del pacchetto npm senza una versione o un tag risolve anch'esso tornando al
record del plugin tracciato. Usalo quando un plugin era fissato a una versione esatta e
vuoi riportarlo alla linea di release predefinita del registry.

Prima di un aggiornamento npm live, OpenClaw controlla la versione del pacchetto installato rispetto
ai metadati del registry npm. Se la versione installata e l'identità dell'artifact registrato
corrispondono già alla destinazione risolta, l'aggiornamento viene saltato senza
scaricare, reinstallare o riscrivere `openclaw.json`.

Quando esiste un hash di integrità memorizzato e l'hash dell'artifact recuperato cambia,
OpenClaw tratta la situazione come deriva dell'artifact npm. Il comando interattivo
`openclaw plugins update` stampa gli hash atteso ed effettivo e chiede
conferma prima di procedere. Gli helper di aggiornamento non interattivi falliscono in modalità chiusa
a meno che il chiamante non fornisca una policy esplicita di continuazione.

`--dangerously-force-unsafe-install` è disponibile anche su `plugins update` come
override di emergenza per falsi positivi della scansione integrata di codice pericoloso durante
gli aggiornamenti dei plugin. Non aggira comunque i blocchi di policy di `before_install` del plugin
o il blocco in caso di errore di scansione, e si applica solo agli aggiornamenti dei plugin, non agli aggiornamenti dei pacchetti hook.

### Ispezionare

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Introspezione approfondita di un singolo plugin. Mostra identità, stato di caricamento, fonte,
capacità registrate, hook, strumenti, comandi, servizi, metodi Gateway,
route HTTP, flag di policy, diagnostica, metadati di installazione, capacità del bundle
ed eventuale supporto MCP o server LSP rilevato.

Ogni plugin viene classificato in base a ciò che registra realmente a runtime:

- **plain-capability** — un solo tipo di capacità (ad esempio un plugin solo provider)
- **hybrid-capability** — più tipi di capacità (ad esempio testo + voce + immagini)
- **hook-only** — solo hook, nessuna capacità o superficie
- **non-capability** — strumenti/comandi/servizi ma nessuna capacità

Vedi [Forme dei plugin](/it/plugins/architecture#plugin-shapes) per maggiori informazioni sul modello delle capacità.

Il flag `--json` produce un report leggibile da macchina adatto per scripting e
audit.

`inspect --all` renderizza una tabella a livello di flotta con forma, tipi di capacità,
avvisi di compatibilità, capacità del bundle e colonne di riepilogo degli hook.

`info` è un alias di `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` segnala errori di caricamento dei plugin, diagnostica di manifest/discovery e
avvisi di compatibilità. Quando è tutto pulito stampa `No plugin issues
detected.`

Per i fallimenti della forma del modulo, come esportazioni `register`/`activate` mancanti, riesegui
con `OPENCLAW_PLUGIN_LOAD_DEBUG=1` per includere un riepilogo compatto della forma delle esportazioni nell'
output diagnostico.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list accetta un percorso locale del marketplace, un percorso `marketplace.json`, una
forma abbreviata GitHub come `owner/repo`, un URL di repo GitHub o un URL git. `--json`
stampa l'etichetta della fonte risolta più il manifest del marketplace analizzato e
le voci dei plugin.
