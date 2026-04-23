---
read_when:
    - Vuoi gestire gli hook dell'agente
    - Vuoi controllare la disponibilità degli hook o abilitare gli hook del workspace
summary: Riferimento CLI per `openclaw hooks` (hook dell'agente)
title: hook
x-i18n:
    generated_at: "2026-04-23T08:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestisci gli hook dell'agente (automazioni guidate da eventi per comandi come `/new`, `/reset` e l'avvio del gateway).

Eseguire `openclaw hooks` senza sottocomandi equivale a `openclaw hooks list`.

Correlati:

- Hook: [Hook](/it/automation/hooks)
- Hook dei plugin: [Hook dei plugin](/it/plugins/architecture#provider-runtime-hooks)

## Elencare tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook individuati dalle directory workspace, managed, extra e bundled.
L'avvio del gateway non carica i gestori degli hook interni finché non viene configurato almeno un hook interno.

**Opzioni:**

- `--eligible`: Mostra solo gli hook idonei (requisiti soddisfatti)
- `--json`: Output in JSON
- `-v, --verbose`: Mostra informazioni dettagliate, inclusi i requisiti mancanti

**Esempio di output:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Esempio (verbose):**

```bash
openclaw hooks list --verbose
```

Mostra i requisiti mancanti per gli hook non idonei.

**Esempio (JSON):**

```bash
openclaw hooks list --json
```

Restituisce JSON strutturato per uso programmatico.

## Ottenere informazioni su un hook

```bash
openclaw hooks info <name>
```

Mostra informazioni dettagliate su un hook specifico.

**Argomenti:**

- `<name>`: nome dell'hook o chiave dell'hook (ad esempio `session-memory`)

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

## Controllare l'idoneità degli hook

```bash
openclaw hooks check
```

Mostra un riepilogo dello stato di idoneità degli hook (quanti sono pronti rispetto a quanti non lo sono).

**Opzioni:**

- `--json`: Output in JSON

**Esempio di output:**

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

Abilita un hook specifico aggiungendolo alla tua configurazione (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** gli hook del workspace sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella configurazione. Gli hook gestiti dai plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il plugin.

**Argomenti:**

- `<name>`: nome dell'hook (ad esempio `session-memory`)

**Esempio:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Enabled hook: 💾 session-memory
```

**Che cosa fa:**

- Controlla se l'hook esiste ed è idoneo
- Aggiorna `hooks.internal.entries.<name>.enabled = true` nella tua configurazione
- Salva la configurazione su disco

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di opt-in è richiesto prima
che il gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il gateway in modo che gli hook vengano ricaricati (riavvio dell'app menu bar su macOS, oppure riavvia il processo gateway in dev).

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Disabilita un hook specifico aggiornando la tua configurazione.

**Argomenti:**

- `<name>`: nome dell'hook (ad esempio `command-logger`)

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
- Gli hook gestiti dai plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il plugin proprietario.

## Installare pacchetti di hook

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installa pacchetti di hook tramite l'installer unificato dei plugin.

`openclaw hooks install` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registry** (nome pacchetto + **versione esatta** facoltativa oppure
**dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze
vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche bare e `@latest` restano sul canale stabile. Se npm risolve una di
queste a una prerelease, OpenClaw si ferma e ti chiede di eseguire esplicitamente l'opt-in con un
tag prerelease come `@beta`/`@rc` oppure una versione prerelease esatta.

**Che cosa fa:**

- Copia il pacchetto di hook in `~/.openclaw/hooks/<id>`
- Abilita gli hook installati in `hooks.internal.entries.*`
- Registra l'installazione in `hooks.internal.installs`

**Opzioni:**

- `-l, --link`: Collega una directory locale invece di copiarla (la aggiunge a `hooks.internal.load.extraDirs`)
- `--pin`: Registra le installazioni npm come `name@version` risolto esatto in `hooks.internal.installs`

**Archivi supportati:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Esempi:**

```bash
# Directory locale
openclaw plugins install ./my-hook-pack

# Archivio locale
openclaw plugins install ./my-hook-pack.zip

# Pacchetto NPM
openclaw plugins install @openclaw/my-hook-pack

# Collega una directory locale senza copiarla
openclaw plugins install -l ./my-hook-pack
```

I pacchetti di hook collegati vengono trattati come hook gestiti da una directory
configurata dall'operatore, non come hook del workspace.

## Aggiornare i pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'updater unificato dei plugin.

`openclaw hooks update` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: Aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: Mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia,
OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa il flag globale `--yes` per bypassare i prompt nelle esecuzioni CI/non interattive.

## Hook inclusi

### session-memory

Salva il contesto della sessione in memoria quando esegui `/new` o `/reset`.

**Abilita:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Vedi:** [documentazione session-memory](/it/automation/hooks#session-memory)

### bootstrap-extra-files

Inietta file bootstrap aggiuntivi (ad esempio `AGENTS.md` / `TOOLS.md` locali al monorepo) durante `agent:bootstrap`.

**Abilita:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Vedi:** [documentazione bootstrap-extra-files](/it/automation/hooks#bootstrap-extra-files)

### command-logger

Registra tutti gli eventi di comando in un file di audit centralizzato.

**Abilita:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**Visualizzare i log:**

```bash
# Comandi recenti
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filtra per azione
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Vedi:** [documentazione command-logger](/it/automation/hooks#command-logger)

### boot-md

Esegue `BOOT.md` all'avvio del gateway (dopo l'avvio dei canali).

**Eventi**: `gateway:startup`

**Abilita**:

```bash
openclaw hooks enable boot-md
```

**Vedi:** [documentazione boot-md](/it/automation/hooks#boot-md)
