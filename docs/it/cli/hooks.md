---
read_when:
    - Vuoi gestire gli hook dell'agente
    - Vuoi ispezionare la disponibilità degli hook o abilitare gli hook del workspace
summary: Riferimento CLI per `openclaw hooks` (hook dell'agente)
title: Hook
x-i18n:
    generated_at: "2026-04-24T08:33:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestisci gli hook dell'agente (automazioni event-driven per comandi come `/new`, `/reset` e l'avvio del Gateway).

Eseguire `openclaw hooks` senza sottocomandi equivale a `openclaw hooks list`.

Correlati:

- Hook: [Hook](/it/automation/hooks)
- Hook dei Plugin: [Hook dei Plugin](/it/plugins/architecture-internals#provider-runtime-hooks)

## Elencare tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook rilevati dalle directory workspace, managed, extra e bundled.
All'avvio del Gateway, i gestori degli hook interni non vengono caricati finché non è configurato almeno un hook interno.

**Opzioni:**

- `--eligible`: mostra solo gli hook idonei (requisiti soddisfatti)
- `--json`: output come JSON
- `-v, --verbose`: mostra informazioni dettagliate, inclusi i requisiti mancanti

**Esempio di output:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Esegui BOOT.md all'avvio del Gateway
  📎 bootstrap-extra-files ✓ - Inietta file bootstrap extra del workspace durante il bootstrap dell'agente
  📝 command-logger ✓ - Registra tutti gli eventi dei comandi in un file di audit centralizzato
  💾 session-memory ✓ - Salva il contesto della sessione nella memoria quando viene emesso il comando /new o /reset
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

- `<name>`: nome hook o chiave hook (per esempio `session-memory`)

**Opzioni:**

- `--json`: output come JSON

**Esempio:**

```bash
openclaw hooks info session-memory
```

**Output:**

```
💾 session-memory ✓ Ready

Salva il contesto della sessione nella memoria quando viene emesso il comando /new o /reset

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

Mostra un riepilogo dello stato di idoneità degli hook (quanti sono pronti e quanti no).

**Opzioni:**

- `--json`: output come JSON

**Esempio di output:**

```
Stato degli hook

Hook totali: 4
Pronti: 4
Non pronti: 0
```

## Abilitare un hook

```bash
openclaw hooks enable <name>
```

Abilita un hook specifico aggiungendolo alla configurazione (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** gli hook del workspace sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella configurazione. Gli hook gestiti dai Plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il Plugin.

**Argomenti:**

- `<name>`: nome hook (per esempio `session-memory`)

**Esempio:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Hook abilitato: 💾 session-memory
```

**Cosa fa:**

- Verifica se l'hook esiste ed è idoneo
- Aggiorna `hooks.internal.entries.<name>.enabled = true` nella configurazione
- Salva la configurazione su disco

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di opt-in è richiesto prima che
il Gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il Gateway per ricaricare gli hook (riavvio dell'app nella barra dei menu su macOS, oppure riavvia il processo Gateway in dev).

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Disabilita un hook specifico aggiornando la configurazione.

**Argomenti:**

- `<name>`: nome hook (per esempio `command-logger`)

**Esempio:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Hook disabilitato: 📝 command-logger
```

**Dopo la disabilitazione:**

- Riavvia il Gateway per ricaricare gli hook

## Note

- `openclaw hooks list --json`, `info --json` e `check --json` scrivono JSON strutturato direttamente su stdout.
- Gli hook gestiti dai Plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il Plugin proprietario.

## Installare pacchetti di hook

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Installa pacchetti di hook tramite l'installer unificato dei Plugin.

`openclaw hooks install` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registro** (nome pacchetto + **versione esatta** facoltativa o
**dist-tag**). Specifiche Git/URL/file e intervalli semver vengono rifiutati. Le installazioni
delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche semplici e `@latest` restano sul canale stabile. Se npm risolve una delle due
a una prerelease, OpenClaw si ferma e ti chiede di fare opt-in esplicito con un
tag prerelease come `@beta`/`@rc` o una versione prerelease esatta.

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

I pacchetti di hook collegati vengono trattati come hook managed da una directory
configurata dall'operatore, non come hook del workspace.

## Aggiornare pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'updater unificato dei Plugin.

`openclaw hooks update` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia,
OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa
il flag globale `--yes` per bypassare i prompt in esecuzioni CI/non interattive.

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

Inietta file bootstrap aggiuntivi (per esempio `AGENTS.md` / `TOOLS.md` locali al monorepo) durante `agent:bootstrap`.

**Abilita:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Vedi:** [documentazione bootstrap-extra-files](/it/automation/hooks#bootstrap-extra-files)

### command-logger

Registra tutti gli eventi dei comandi in un file di audit centralizzato.

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

Esegue `BOOT.md` quando il Gateway si avvia (dopo l'avvio dei canali).

**Eventi**: `gateway:startup`

**Abilita**:

```bash
openclaw hooks enable boot-md
```

**Vedi:** [documentazione boot-md](/it/automation/hooks#boot-md)

## Correlati

- [Riferimento CLI](/it/cli)
- [Hook di automazione](/it/automation/hooks)
