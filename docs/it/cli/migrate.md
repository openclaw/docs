---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un fornitore di migrazione di proprietà del plugin
summary: Riferimento CLI per `openclaw migrate` (importa lo stato da un altro sistema di agenti)
title: Migrare
x-i18n:
    generated_at: "2026-04-30T08:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema di agenti tramite un provider di migrazione gestito da un plugin. I provider inclusi coprono [Claude](/it/install/migrating-claude) e [Hermes](/it/install/migrating-hermes); i plugin di terze parti possono registrare provider aggiuntivi.

<Tip>
Per le procedure guidate rivolte agli utenti, vedi [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L'[hub di migrazione](/it/install/migrating) elenca tutti i percorsi.
</Tip>

## Comandi

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nome di un provider di migrazione registrato, per esempio `hermes`. Esegui `openclaw migrate list` per vedere i provider installati.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Costruisce il piano ed esce senza modificare lo stato.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sovrascrive la directory dello stato di origine. Hermes usa `~/.hermes` come valore predefinito.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa le credenziali supportate. Disattivato per impostazione predefinita.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente ad apply di sostituire le destinazioni esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta la richiesta di conferma. Obbligatorio in modalità non interattiva.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Salta il backup prima dell'applicazione. Richiede `--force` quando esiste uno stato OpenClaw locale.
</ParamField>
<ParamField path="--force" type="boolean">
  Richiesto insieme a `--no-backup` quando apply altrimenti rifiuterebbe di saltare il backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il piano o il risultato di apply come JSON. Con `--json` e senza `--yes`, apply stampa il piano e non modifica lo stato.
</ParamField>

## Modello di sicurezza

`openclaw migrate` funziona prima in anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima di applicare">
    Il provider restituisce un piano dettagliato prima che venga modificato qualcosa, inclusi conflitti, elementi saltati ed elementi sensibili. I piani JSON, l'output di apply e i report di migrazione oscurano le chiavi annidate che sembrano segreti, come chiavi API, token, intestazioni di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra l'anteprima del piano e richiede conferma prima di modificare lo stato, a meno che `--yes` non sia impostato. In modalità non interattiva, apply richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    Apply crea e verifica un backup OpenClaw prima di applicare la migrazione. Se non esiste ancora uno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione può continuare. Per saltare un backup quando lo stato esiste, passa sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    Apply rifiuta di continuare quando il piano presenta conflitti. Esamina il piano, quindi riesegui con `--overwrite` se la sostituzione delle destinazioni esistenti è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory del report di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    I segreti non vengono mai importati per impostazione predefinita. Usa `--include-secrets` per importare le credenziali supportate.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva per impostazione predefinita lo stato di Claude Code in `~/.claude`. Usa `--from <path>` per importare una specifica home di Claude Code o una root di progetto.

<Tip>
Per una procedura guidata rivolta agli utenti, vedi [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- `CLAUDE.md` di progetto e `.claude/CLAUDE.md` nello spazio di lavoro dell'agente OpenClaw.
- `~/.claude/CLAUDE.md` dell'utente aggiunto a `USER.md` dello spazio di lavoro.
- Definizioni dei server MCP da `.mcp.json` di progetto, `~/.claude.json` di Claude Code e `claude_desktop_config.json` di Claude Desktop.
- Directory delle Skills di Claude che includono `SKILL.md`.
- File Markdown dei comandi Claude convertiti in Skills OpenClaw solo con invocazione manuale.

### Stato archiviato e da revisionare manualmente

Hook, autorizzazioni, impostazioni predefinite dell'ambiente, memoria locale, regole con ambito di percorso, sottoagenti, cache, piani e cronologia di progetto di Claude vengono conservati nel report di migrazione o segnalati come elementi da revisionare manualmente. OpenClaw non esegue hook, non copia allowlist ampie e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Hermes

Il provider Hermes incluso rileva per impostazione predefinita lo stato in `~/.hermes`. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- Configurazione del modello predefinito da `config.yaml`.
- Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell'agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Impostazioni predefinite della configurazione di memoria per la memoria su file di OpenClaw, più elementi archiviati o da revisionare manualmente per provider di memoria esterni come Honcho.
- Skills che includono un file `SKILL.md` sotto `skills/<name>/`.
- Valori di configurazione per singola skill da `skills.config`.
- Chiavi API supportate da `.env`, solo con `--include-secrets`.

### Chiavi `.env` supportate

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stato solo archiviato

Lo stato Hermes che OpenClaw non può interpretare in modo sicuro viene copiato nel report di migrazione per la revisione manuale, ma non viene caricato nella configurazione o nelle credenziali live di OpenClaw. Questo conserva lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo attendibile automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Dopo l'applicazione

```bash
openclaw doctor
```

## Contratto Plugin

Le origini di migrazione sono plugin. Un plugin dichiara i propri ID provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

A runtime il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Core gestisce l'orchestrazione CLI, la politica di backup, i prompt, l'output JSON e il preflight dei conflitti. Core passa il piano revisionato in `apply(ctx, plan)`, e i provider possono ricostruire il piano solo quando quell'argomento è assente per compatibilità.

I plugin provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi di riepilogo, più `openclaw/plugin-sdk/migration-runtime` per copie di file consapevoli dei conflitti, copie nei report solo archivio, wrapper config-runtime memorizzati nella cache e report di migrazione.

## Integrazione con l'onboarding

L'onboarding può offrire la migrazione quando un provider rileva un'origine nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione del plugin e mostrano comunque un'anteprima prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una configurazione OpenClaw nuova. Reimposta prima configurazione, credenziali, sessioni e spazio di lavoro se hai già uno stato locale. Le importazioni backup-più-sovrascrittura o merge sono abilitate da feature gate per le configurazioni esistenti.
</Note>

## Correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): procedura guidata rivolta agli utenti.
- [Migrazione da Claude](/it/install/migrating-claude): procedura guidata rivolta agli utenti.
- [Migrazione](/it/install/migrating): sposta OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo l'applicazione di una migrazione.
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
