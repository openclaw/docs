---
read_when:
    - Vuoi gestire gli hook degli agenti
    - Vuoi controllare la disponibilità degli hook o abilitare gli hook dell'area di lavoro
summary: Riferimento CLI per `openclaw hooks` (hook degli agenti)
title: Ganci
x-i18n:
    generated_at: "2026-04-30T08:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestisci gli hook degli agenti (automazioni guidate da eventi per comandi come `/new`, `/reset` e l'avvio del Gateway).

Eseguire `openclaw hooks` senza sottocomando equivale a `openclaw hooks list`.

Correlati:

- Hook: [Hook](/it/automation/hooks)
- Hook dei Plugin: [Hook dei Plugin](/it/plugins/hooks)

## Elenca tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook rilevati dalle directory di workspace, gestite, extra e incluse.
L'avvio del Gateway non carica i gestori interni degli hook finché non è configurato almeno un hook interno.

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

## Ottieni informazioni su un hook

```bash
openclaw hooks info <name>
```

Mostra informazioni dettagliate su un hook specifico.

**Argomenti:**

- `<name>`: Nome dell'hook o chiave dell'hook (ad esempio, `session-memory`)

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

## Controlla l'idoneità degli hook

```bash
openclaw hooks check
```

Mostra un riepilogo dello stato di idoneità degli hook (quanti sono pronti e quanti non lo sono).

**Opzioni:**

- `--json`: Output in JSON

**Esempio di output:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Abilita un hook

```bash
openclaw hooks enable <name>
```

Abilita un hook specifico aggiungendolo alla tua configurazione (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** Gli hook del workspace sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella configurazione. Gli hook gestiti dai plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il plugin.

**Argomenti:**

- `<name>`: Nome dell'hook (ad esempio, `session-memory`)

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

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di consenso esplicito è necessario prima che
il Gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il Gateway in modo che gli hook vengano ricaricati (riavvio dell'app nella barra dei menu su macOS, oppure riavvia il processo Gateway in sviluppo).

## Disabilita un hook

```bash
openclaw hooks disable <name>
```

Disabilita un hook specifico aggiornando la tua configurazione.

**Argomenti:**

- `<name>`: Nome dell'hook (ad esempio, `command-logger`)

**Esempio:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Disabled hook: 📝 command-logger
```

**Dopo la disabilitazione:**

- Riavvia il Gateway in modo che gli hook vengano ricaricati

## Note

- `openclaw hooks list --json`, `info --json` e `check --json` scrivono JSON strutturato direttamente su stdout.
- Gli hook gestiti dai plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il plugin proprietario.

## Installa pacchetti di hook

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installa pacchetti di hook tramite il programma di installazione unificato dei plugin.

`openclaw hooks install` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registry** (nome del pacchetto + **versione esatta** facoltativa o
**dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le installazioni delle dipendenze
vengono eseguite localmente al progetto con `--ignore-scripts` per sicurezza, anche quando la tua
shell ha impostazioni globali di installazione npm.

Le specifiche nude e `@latest` restano sul canale stabile. Se npm risolve una di
queste in una prerelease, OpenClaw si interrompe e ti chiede di aderire esplicitamente con un
tag di prerelease come `@beta`/`@rc` o una versione di prerelease esatta.

**Cosa fa:**

- Copia il pacchetto di hook in `~/.openclaw/hooks/<id>`
- Abilita gli hook installati in `hooks.internal.entries.*`
- Registra l'installazione in `hooks.internal.installs`

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

I pacchetti di hook collegati sono trattati come hook gestiti da una directory
configurata dall'operatore, non come hook del workspace.

## Aggiorna pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'aggiornatore unificato dei plugin.

`openclaw hooks update` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: Aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: Mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità salvato e l'hash dell'artefatto recuperato cambia,
OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa
`--yes` globale per bypassare le richieste nelle esecuzioni CI/non interattive.

## Hook inclusi

### session-memory

Salva il contesto della sessione in memoria quando emetti `/new` o `/reset`.

**Abilita:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Vedi:** [documentazione di session-memory](/it/automation/hooks#session-memory)

### bootstrap-extra-files

Inietta file di bootstrap aggiuntivi (ad esempio `AGENTS.md` / `TOOLS.md` locali al monorepo) durante `agent:bootstrap`.

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

**Visualizza log:**

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

Esegue `BOOT.md` quando il Gateway si avvia (dopo l'avvio dei canali).

**Eventi**: `gateway:startup`

**Abilita**:

```bash
openclaw hooks enable boot-md
```

**Vedi:** [documentazione di boot-md](/it/automation/hooks#boot-md)

## Correlati

- [Riferimento CLI](/it/cli)
- [Hook di automazione](/it/automation/hooks)
