---
read_when:
    - Vuoi gestire gli hook dell'agente
    - Vuoi verificare la disponibilità degli hook o abilitare gli hook dell'area di lavoro
summary: Riferimento CLI per `openclaw hooks` (hook dell'agente)
title: Hook
x-i18n:
    generated_at: "2026-07-12T06:53:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gestisce gli hook degli agenti (automazioni basate su eventi per comandi come `/new`, `/reset` e l'avvio del Gateway). Il semplice comando `openclaw hooks` equivale a `openclaw hooks list`.

Correlati: [Hook](/it/automation/hooks) - [Hook dei Plugin](/it/plugins/hooks)

## Elencare gli hook

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Elenca gli hook rilevati nelle directory dell'area di lavoro, gestite, aggiuntive e integrate.

- `--eligible`: solo gli hook i cui requisiti sono soddisfatti.
- `--json`: output strutturato.
- `-v, --verbose`: include una colonna Mancanti con i requisiti non soddisfatti.

```
Hook (4/5 pronti)

Pronti:
  🚀 boot-md ✓ - Esegue BOOT.md all'avvio del Gateway
  📎 bootstrap-extra-files ✓ - Inserisce file di bootstrap aggiuntivi dell'area di lavoro durante il bootstrap dell'agente
  📝 command-logger ✓ - Registra tutti gli eventi dei comandi in un file di audit centralizzato
  💾 session-memory ✓ - Salva il contesto della sessione in memoria quando viene eseguito il comando /new o /reset
```

## Ottenere informazioni su un hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` è il nome o la chiave dell'hook (ad esempio `session-memory`). Mostra l'origine, i percorsi dei file e dei gestori, la pagina iniziale, gli eventi e lo stato di ciascun requisito (file binari, ambiente, configurazione, sistema operativo).

## Verificare l'idoneità

```bash
openclaw hooks check [--json]
```

Stampa un riepilogo del numero di hook pronti e non pronti; se alcuni hook non sono pronti, li elenca indicando per ciascuno il motivo del blocco.

## Abilitare un hook

```bash
openclaw hooks enable <name>
```

Aggiunge o aggiorna `hooks.internal.entries.<name>.enabled = true` nella configurazione e attiva anche l'interruttore principale `hooks.internal.enabled` (il Gateway non carica alcun gestore di hook interno finché non ne viene configurato almeno uno). Il comando non riesce se l'hook non esiste, è gestito da un Plugin o non è idoneo (requisiti mancanti).

Gli hook gestiti dai Plugin mostrano `plugin:<id>` in `hooks list` e non possono essere abilitati o disabilitati da qui; abilita o disabilita invece il Plugin proprietario.

Dopo l'abilitazione, riavvia il Gateway (riavvia l'app della barra dei menu di macOS oppure, in fase di sviluppo, il processo del Gateway) affinché ricarichi gli hook.

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Imposta `hooks.internal.entries.<name>.enabled = false`. In seguito, riavvia il Gateway.

## Installare e aggiornare i pacchetti di hook

```bash
openclaw plugins install <package>        # npm per impostazione predefinita
openclaw plugins install npm:<package>    # solo npm
openclaw plugins install <package> --pin  # blocca la versione risolta
openclaw plugins install <path>           # directory o archivio locale
openclaw plugins install -l <path>        # collega una directory locale invece di copiarla

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

I pacchetti di hook vengono installati tramite il programma unificato di installazione e aggiornamento dei Plugin; `openclaw hooks install` e `openclaw hooks update` continuano a funzionare come alias deprecati che mostrano un avviso e inoltrano l'operazione ai comandi `plugins`.

- Le specifiche npm possono fare riferimento esclusivamente al registro: nome del pacchetto più un'eventuale versione esatta o dist-tag. Le specifiche Git, URL e file e gli intervalli semver vengono rifiutati. Le dipendenze vengono installate localmente nel progetto con `--ignore-scripts`.
- Le specifiche senza qualificatore e `@latest` rimangono sul canale stabile; se npm risolve una versione preliminare, OpenClaw interrompe l'operazione e chiede di aderire esplicitamente (`@beta`, `@rc` o una versione preliminare esatta).
- Archivi supportati: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` collega una directory locale invece di copiarla (aggiungendola a `hooks.internal.load.extraDirs`); i pacchetti di hook collegati sono hook gestiti provenienti da una directory configurata dall'operatore, non hook dell'area di lavoro.
- `--pin` registra le installazioni npm come `name@version` risolto esatto in `hooks.internal.installs`.
- L'installazione copia il pacchetto in `~/.openclaw/hooks/<id>`, abilita i relativi hook in `hooks.internal.entries.*` e registra l'installazione in `hooks.internal.installs`.
- Se un hash di integrità memorizzato non corrisponde più all'artefatto recuperato, OpenClaw mostra un avviso e chiede conferma prima di continuare; passa l'opzione globale `--yes` per ignorare la richiesta (ad esempio in CI).

## Hook integrati

| Hook                  | Eventi                                            | Funzione                                                                                                     |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` all'avvio del Gateway per ogni ambito agente configurato                                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inserisce file di bootstrap aggiuntivi (ad esempio `AGENTS.md`/`TOOLS.md` di un monorepo) durante il bootstrap dell'agente |
| command-logger        | `command`                                         | Registra gli eventi dei comandi in `~/.openclaw/logs/commands.log`                                           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia notifiche visibili nella chat quando la Compaction della sessione inizia e termina                     |
| session-memory        | `command:new`, `command:reset`                    | Salva il contesto della sessione in memoria quando viene eseguito `/new` o `/reset`                          |

Abilita qualsiasi hook integrato con `openclaw hooks enable <hook-name>`. Dettagli completi, chiavi di configurazione e valori predefiniti: [Hook integrati](/it/automation/hooks#bundled-hooks).

### File di registro di command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # comandi recenti
cat ~/.openclaw/logs/commands.log | jq .          # stampa formattata
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtra per azione
```

## Note

- `hooks list --json`, `info --json` e `check --json` scrivono il JSON strutturato direttamente nello standard output.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Hook di automazione](/it/automation/hooks)
