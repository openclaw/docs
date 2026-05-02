---
read_when:
    - Vuoi gestire gli hook degli agenti
    - Vuoi controllare la disponibilità degli hook o abilitare gli hook dell'area di lavoro
summary: Riferimento CLI per `openclaw hooks` (agganci degli agenti)
title: Ganci
x-i18n:
    generated_at: "2026-05-02T20:42:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestisci gli hook degli agenti (automazioni guidate da eventi per comandi come `/new`, `/reset` e l'avvio del Gateway).

Eseguire `openclaw hooks` senza sottocomando equivale a `openclaw hooks list`.

Correlati:

- Hook: [Hook](/it/automation/hooks)
- Hook dei Plugin: [Hook dei Plugin](/it/plugins/hooks)

## Elencare tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook rilevati dalle directory workspace, gestite, extra e incluse.
L'avvio del Gateway non carica i gestori di hook interni finché non è configurato almeno un hook interno.

**Opzioni:**

- `--eligible`: Mostra solo gli hook idonei (requisiti soddisfatti)
- `--json`: Output in JSON
- `-v, --verbose`: Mostra informazioni dettagliate, inclusi i requisiti mancanti

**Output di esempio:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Esempio (dettagliato):**

```bash
openclaw hooks list --verbose
```

Mostra i requisiti mancanti per gli hook non idonei.

**Esempio (JSON):**

```bash
openclaw hooks list --json
```

Restituisce JSON strutturato per l'uso programmatico.

## Ottenere informazioni sugli hook

```bash
openclaw hooks info <name>
```

Mostra informazioni dettagliate su uno specifico hook.

**Argomenti:**

- `<name>`: Nome dell'hook o chiave dell'hook (ad esempio `session-memory`)

**Opzioni:**

- `--json`: Output in JSON

**Esempio:**

```bash
openclaw hooks info session-memory
```

**Output:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Verificare l'idoneità degli hook

```bash
openclaw hooks check
```

Mostra un riepilogo dello stato di idoneità degli hook (quanti sono pronti rispetto a quanti non lo sono).

**Opzioni:**

- `--json`: Output in JSON

**Output di esempio:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Abilitare un hook

```bash
openclaw hooks enable <name>
```

Abilita uno specifico hook aggiungendolo alla tua configurazione (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** Gli hook del workspace sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella configurazione. Gli hook gestiti dai Plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il Plugin.

**Argomenti:**

- `<name>`: Nome dell'hook (ad esempio `session-memory`)

**Esempio:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Enabled hook: 💾 session-memory
```

**Cosa fa:**

- Verifica se l'hook esiste ed è idoneo
- Aggiorna `hooks.internal.entries.<name>.enabled = true` nella tua configurazione
- Salva la configurazione su disco

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di opt-in è obbligatorio prima che il Gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il gateway in modo che gli hook vengano ricaricati (riavvio dell'app nella barra dei menu su macOS, oppure riavvia il processo gateway in sviluppo).

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Disabilita uno specifico hook aggiornando la tua configurazione.

**Argomenti:**

- `<name>`: Nome dell'hook (ad esempio `command-logger`)

**Esempio:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Disabled hook: 📝 command-logger
```

**Dopo la disabilitazione:**

- Riavvia il gateway in modo che gli hook vengano ricaricati

## Note

- `openclaw hooks list --json`, `info --json` e `check --json` scrivono JSON strutturato direttamente su stdout.
- Gli hook gestiti dai Plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il Plugin proprietario.

## Installare pacchetti di hook

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installa pacchetti di hook tramite l'installer unificato dei Plugin.

`openclaw hooks install` funziona ancora come alias di compatibilità, ma stampa un avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registry** (nome del pacchetto + **versione esatta** opzionale o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite a livello di progetto con `--ignore-scripts` per sicurezza, anche quando la tua shell ha impostazioni globali di installazione npm.

Le specifiche semplici e `@latest` restano sul canale stabile. Se npm risolve una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta.

**Cosa fa:**

- Copia il pacchetto di hook in `~/.openclaw/hooks/<id>`
- Abilita gli hook installati in `hooks.internal.entries.*`
- Registra l'installazione sotto `hooks.internal.installs`

**Opzioni:**

- `-l, --link`: Collega una directory locale invece di copiarla (la aggiunge a `hooks.internal.load.extraDirs`)
- `--pin`: Registra le installazioni npm come `name@version` risolto esatto in `hooks.internal.installs`

**Archivi supportati:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Esempi:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

I pacchetti di hook collegati vengono trattati come hook gestiti da una directory configurata dall'operatore, non come hook del workspace.

## Aggiornare pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'updater unificato dei Plugin.

`openclaw hooks update` funziona ancora come alias di compatibilità, ma stampa un avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: Aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: Mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità salvato e l'hash dell'artefatto recuperato cambia, OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa `--yes` globale per bypassare le richieste di conferma nelle esecuzioni CI/non interattive.

## Hook inclusi

### session-memory

Salva il contesto della sessione in memoria quando esegui `/new` o `/reset`.

**Abilita:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Vedi:** [documentazione di session-memory](/it/automation/hooks#session-memory)

### bootstrap-extra-files

Inietta file bootstrap aggiuntivi (ad esempio `AGENTS.md` / `TOOLS.md` locali a un monorepo) durante `agent:bootstrap`.

**Abilita:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Vedi:** [documentazione di bootstrap-extra-files](/it/automation/hooks#bootstrap-extra-files)

### command-logger

Registra tutti gli eventi di comando in un file di audit centralizzato.

**Abilita:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**Visualizzare i log:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Vedi:** [documentazione di command-logger](/it/automation/hooks#command-logger)

### boot-md

Esegue `BOOT.md` all'avvio del gateway (dopo l'avvio dei canali).

**Eventi**: `gateway:startup`

**Abilita**:

```bash
openclaw hooks enable boot-md
```

**Vedi:** [documentazione di boot-md](/it/automation/hooks#boot-md)

## Correlati

- [Riferimento CLI](/it/cli)
- [Hook di automazione](/it/automation/hooks)
