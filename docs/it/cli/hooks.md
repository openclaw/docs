---
read_when:
    - Vuoi gestire gli hook dell'agente
    - Vuoi esaminare la disponibilità degli hook o abilitare gli hook del workspace
summary: Riferimento CLI per `openclaw hooks` (hook dell'agente)
title: hooks
x-i18n:
    generated_at: "2026-04-05T13:48:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestisci gli hook dell'agente (automazioni guidate da eventi per comandi come `/new`, `/reset` e l'avvio del gateway).

Eseguire `openclaw hooks` senza sottocomandi equivale a `openclaw hooks list`.

Correlati:

- Hook: [Hooks](/it/automation/hooks)
- Hook dei plugin: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Elencare tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook rilevati dalle directory workspace, managed, extra e bundled.

**Opzioni:**

- `--eligible`: mostra solo gli hook idonei (requisiti soddisfatti)
- `--json`: output in formato JSON
- `-v, --verbose`: mostra informazioni dettagliate, inclusi i requisiti mancanti

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

- `--json`: output in formato JSON

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

- `--json`: output in formato JSON

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

Abilita un hook specifico aggiungendolo alla tua config (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** Gli hook del workspace sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella config. Gli hook gestiti dai plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il plugin.

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

**Cosa fa:**

- Verifica se l'hook esiste ed è idoneo
- Aggiorna `hooks.internal.entries.<name>.enabled = true` nella tua config
- Salva la config su disco

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di adesione esplicita è richiesto prima che il Gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il gateway affinché gli hook vengano ricaricati (riavvio dell'app della barra dei menu su macOS, oppure riavvia il processo gateway in sviluppo).

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Disabilita un hook specifico aggiornando la tua config.

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

- Riavvia il gateway affinché gli hook vengano ricaricati

## Note

- `openclaw hooks list --json`, `info --json` e `check --json` scrivono JSON strutturato direttamente su stdout.
- Gli hook gestiti dai plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il plugin proprietario.

## Installare pacchetti di hook

```bash
openclaw plugins install <package>        # ClawHub prima, poi npm
openclaw plugins install <package> --pin  # blocca la versione
openclaw plugins install <path>           # percorso locale
```

Installa pacchetti di hook tramite l'installer unificato dei plugin.

`openclaw hooks install` continua a funzionare come alias di compatibilità, ma stampa un avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registro** (nome del pacchetto + **versione esatta** facoltativa o **dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche senza suffisso e `@latest` restano sul canale stabile. Se npm risolve una di queste a una prerelease, OpenClaw si ferma e ti chiede di aderire esplicitamente con un tag prerelease come `@beta`/`@rc` o una versione prerelease esatta.

**Cosa fa:**

- Copia il pacchetto di hook in `~/.openclaw/hooks/<id>`
- Abilita gli hook installati in `hooks.internal.entries.*`
- Registra l'installazione in `hooks.internal.installs`

**Opzioni:**

- `-l, --link`: collega una directory locale invece di copiarla (la aggiunge a `hooks.internal.load.extraDirs`)
- `--pin`: registra le installazioni npm come `name@version` esatto risolto in `hooks.internal.installs`

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

I pacchetti di hook collegati vengono trattati come hook gestiti da una directory configurata dall'operatore, non come hook del workspace.

## Aggiornare pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'updater unificato dei plugin.

`openclaw hooks update` continua a funzionare come alias di compatibilità, ma stampa un avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia, OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa il flag globale `--yes` per bypassare i prompt nelle esecuzioni CI/non interattive.

## Hook inclusi

### session-memory

Salva il contesto della sessione nella memoria quando emetti `/new` o `/reset`.

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

# Stampa formattata
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
