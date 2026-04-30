---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un provider di migrazione gestito dal Plugin
summary: Riferimento CLI per `openclaw migrate` (importa lo stato da un altro sistema di agenti)
title: Migrare
x-i18n:
    generated_at: "2026-04-30T20:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema agent tramite un provider di migrazione posseduto da un Plugin. I provider inclusi coprono lo stato della CLI Codex, [Claude](/it/install/migrating-claude) e [Hermes](/it/install/migrating-hermes); i plugin di terze parti possono registrare provider aggiuntivi.

<Tip>
Per guide dettagliate rivolte agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L'[hub di migrazione](/it/install/migrating) elenca tutti i percorsi.
</Tip>

## Comandi

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nome di un provider di migrazione registrato, ad esempio `hermes`. Esegui `openclaw migrate list` per vedere i provider installati.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Genera il piano ed esce senza modificare lo stato.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sovrascrive la directory dello stato sorgente. Hermes usa `~/.hermes` per impostazione predefinita.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa le credenziali supportate. Disattivato per impostazione predefinita.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente ad apply di sostituire i target esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta la richiesta di conferma. Richiesto in modalità non interattiva.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleziona un elemento di copia skill per nome della skill o id dell'elemento. Ripeti il flag per migrare più skills. Se omesso, le migrazioni Codex interattive mostrano un selettore a caselle di controllo e le migrazioni non interattive mantengono tutte le skills pianificate.
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

`openclaw migrate` dà priorità all'anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima dell'applicazione">
    Il provider restituisce un piano dettagliato prima che cambi qualsiasi cosa, inclusi conflitti, elementi saltati ed elementi sensibili. I piani JSON, l'output di apply e i report di migrazione oscurano le chiavi annidate che sembrano segreti, come chiavi API, token, header di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra l'anteprima del piano e chiede conferma prima di modificare lo stato, salvo che sia impostato `--yes`. In modalità non interattiva, apply richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    Apply crea e verifica un backup OpenClaw prima di applicare la migrazione. Se non esiste ancora uno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione può continuare. Per saltare un backup quando lo stato esiste, passa sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    Apply rifiuta di continuare quando il piano contiene conflitti. Esamina il piano, quindi riesegui con `--overwrite` se la sostituzione dei target esistenti è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory del report di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    I segreti non vengono mai importati per impostazione predefinita. Usa `--include-secrets` per importare le credenziali supportate.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva per impostazione predefinita lo stato di Claude Code in `~/.claude`. Usa `--from <path>` per importare una home Claude Code o una radice di progetto specifica.

<Tip>
Per una guida dettagliata rivolta agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- `CLAUDE.md` di progetto e `.claude/CLAUDE.md` nello spazio di lavoro dell'agent OpenClaw.
- `~/.claude/CLAUDE.md` utente aggiunto a `USER.md` dello spazio di lavoro.
- Definizioni dei server MCP da `.mcp.json` di progetto, `~/.claude.json` di Claude Code e `claude_desktop_config.json` di Claude Desktop.
- Directory delle skill Claude che includono `SKILL.md`.
- File Markdown dei comandi Claude convertiti in skills OpenClaw solo con invocazione manuale.

### Stato di archivio e revisione manuale

Hook Claude, permessi, impostazioni predefinite dell'ambiente, memoria locale, regole con ambito su percorso, subagent, cache, piani e cronologia del progetto vengono conservati nel report di migrazione o segnalati come elementi da revisionare manualmente. OpenClaw non esegue hook, non copia allowlist ampie e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Codex

Il provider Codex incluso rileva per impostazione predefinita lo stato della CLI Codex in `~/.codex`, oppure in
`CODEX_HOME` quando tale variabile d'ambiente è impostata. Usa `--from <path>` per
inventariare una home Codex specifica.

Usa questo provider quando passi all'harness Codex di OpenClaw e vuoi
promuovere deliberatamente risorse personali utili della CLI Codex. Gli avvii del server app Codex locale
usano directory `CODEX_HOME` e `HOME` per agent, quindi per impostazione predefinita non leggono
il tuo stato personale della CLI Codex.

Eseguire `openclaw migrate codex` in un terminale interattivo mostra l'anteprima del
piano completo, poi apre un selettore a caselle di controllo per gli elementi di copia delle skill prima della conferma
finale di apply. Tutte le skills partono selezionate; deseleziona qualsiasi skill che non vuoi
copiare in questo agent. Per esecuzioni scriptate o esatte, passa `--skill <name>` una volta
per skill, ad esempio:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Cosa importa Codex

- Directory delle skill della CLI Codex sotto `$CODEX_HOME/skills`, esclusa la cache
  `.system` di Codex.
- AgentSkills personali sotto `$HOME/.agents/skills`, copiate nello spazio di lavoro dell'agent
  OpenClaw corrente quando vuoi una proprietà per agent.

### Stato Codex da revisione manuale

I plugin nativi Codex, `config.toml` e `hooks/hooks.json` nativo non vengono
attivati automaticamente. I plugin possono esporre server MCP, app, hook o altri
comportamenti eseguibili, quindi il provider li segnala per la revisione invece di caricarli
in OpenClaw. I file di configurazione e hook vengono copiati nel report di migrazione
per revisione manuale.

## Provider Hermes

Il provider Hermes incluso rileva per impostazione predefinita lo stato in `~/.hermes`. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- Configurazione del modello predefinito da `config.yaml`.
- Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell'agent OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Impostazioni predefinite della configurazione della memoria per la memoria su file OpenClaw, più elementi di archivio o revisione manuale per provider di memoria esterni come Honcho.
- Skills che includono un file `SKILL.md` sotto `skills/<name>/`.
- Valori di configurazione per skill da `skills.config`.
- Chiavi API supportate da `.env`, solo con `--include-secrets`.

### Chiavi `.env` supportate

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stato solo archivio

Lo stato Hermes che OpenClaw non può interpretare in sicurezza viene copiato nel report di migrazione per la revisione manuale, ma non viene caricato nella configurazione o nelle credenziali OpenClaw attive. Questo preserva lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo attendibile automaticamente:

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

## Contratto del Plugin

Le sorgenti di migrazione sono plugin. Un plugin dichiara i suoi id provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

A runtime il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Core possiede l'orchestrazione CLI, la policy di backup, i prompt, l'output JSON e il preflight dei conflitti. Core passa il piano revisionato a `apply(ctx, plan)` e i provider possono rigenerare il piano solo quando quell'argomento è assente per compatibilità.

I plugin provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi di riepilogo, più `openclaw/plugin-sdk/migration-runtime` per copie di file consapevoli dei conflitti, copie di report solo archivio, wrapper config-runtime memorizzati in cache e report di migrazione.

## Integrazione con l'onboarding

L'onboarding può offrire la migrazione quando un provider rileva una sorgente nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione del plugin e mostrano comunque un'anteprima prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una configurazione OpenClaw nuova. Reimposta prima configurazione, credenziali, sessioni e spazio di lavoro se hai già uno stato locale. Le importazioni con backup più sovrascrittura o unione sono protette da feature gate per le configurazioni esistenti.
</Note>

## Correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): guida dettagliata rivolta agli utenti.
- [Migrazione da Claude](/it/install/migrating-claude): guida dettagliata rivolta agli utenti.
- [Migrazione](/it/install/migrating): sposta OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo di integrità dopo l'applicazione di una migrazione.
- [Plugins](/it/tools/plugin): installazione e registrazione dei plugin.
