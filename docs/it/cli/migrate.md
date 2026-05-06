---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un fornitore di migrazione di proprietà del Plugin
summary: Riferimento CLI per `openclaw migrate` (importa lo stato da un altro sistema di agenti)
title: Migrazione
x-i18n:
    generated_at: "2026-05-06T08:43:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema agent tramite un provider di migrazione di proprietà di un plugin. I provider inclusi coprono lo stato della CLI Codex, [Claude](/it/install/migrating-claude) e [Hermes](/it/install/migrating-hermes); i plugin di terze parti possono registrare provider aggiuntivi.

<Tip>
Per le guide dettagliate rivolte agli utenti, vedi [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L'[hub delle migrazioni](/it/install/migrating) elenca tutti i percorsi.
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
  Crea il piano ed esci senza modificare lo stato.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sostituisce la directory dello stato sorgente. Hermes usa `~/.hermes` per impostazione predefinita.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa le credenziali supportate. Disattivato per impostazione predefinita.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente ad apply di sostituire i target esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta la richiesta di conferma. Obbligatorio in modalità non interattiva.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleziona un elemento di copia skill per nome della skill o id dell'elemento. Ripeti il flag per migrare più skill. Quando omesso, le migrazioni Codex interattive mostrano un selettore con caselle di controllo e le migrazioni non interattive mantengono tutte le skill pianificate.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Salta il backup prima dell'applicazione. Richiede `--force` quando esiste uno stato OpenClaw locale.
</ParamField>
<ParamField path="--force" type="boolean">
  Obbligatorio insieme a `--no-backup` quando apply altrimenti rifiuterebbe di saltare il backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il piano o il risultato di apply come JSON. Con `--json` e senza `--yes`, apply stampa il piano e non modifica lo stato.
</ParamField>

## Modello di sicurezza

`openclaw migrate` dà priorità all'anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima dell'applicazione">
    Il provider restituisce un piano dettagliato per elementi prima che qualunque cosa cambi, inclusi conflitti, elementi saltati ed elementi sensibili. I piani JSON, l'output di apply e i report di migrazione oscurano chiavi annidate dall'aspetto segreto, come chiavi API, token, header di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra un'anteprima del piano e richiede conferma prima di modificare lo stato, a meno che `--yes` sia impostato. In modalità non interattiva, apply richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    Apply crea e verifica un backup OpenClaw prima di applicare la migrazione. Se non esiste ancora uno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione può continuare. Per saltare un backup quando lo stato esiste, passa sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    Apply rifiuta di continuare quando il piano contiene conflitti. Rivedi il piano, poi riesegui con `--overwrite` se la sostituzione dei target esistenti è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory del report di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    I segreti non vengono mai importati per impostazione predefinita. Usa `--include-secrets` per importare le credenziali supportate.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva lo stato di Claude Code in `~/.claude` per impostazione predefinita. Usa `--from <path>` per importare una home di Claude Code o una radice di progetto specifica.

<Tip>
Per una guida dettagliata rivolta agli utenti, vedi [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- `CLAUDE.md` del progetto e `.claude/CLAUDE.md` nello spazio di lavoro dell'agente OpenClaw.
- `~/.claude/CLAUDE.md` dell'utente aggiunto a `USER.md` dello spazio di lavoro.
- Definizioni dei server MCP da `.mcp.json` del progetto, `~/.claude.json` di Claude Code e `claude_desktop_config.json` di Claude Desktop.
- Directory delle skill Claude che includono `SKILL.md`.
- File Markdown dei comandi Claude convertiti in skill OpenClaw con sola invocazione manuale.

### Stato archiviato e da rivedere manualmente

Hook, permessi, impostazioni predefinite dell'ambiente, memoria locale, regole con ambito di percorso, subagent, cache, piani e cronologia del progetto di Claude vengono conservati nel report di migrazione o segnalati come elementi da rivedere manualmente. OpenClaw non esegue hook, non copia allowlist ampie e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Codex

Il provider Codex incluso rileva lo stato della CLI Codex in `~/.codex` per impostazione predefinita, oppure
in `CODEX_HOME` quando quella variabile di ambiente è impostata. Usa `--from <path>` per
inventariare una home Codex specifica.

Usa questo provider quando passi all'harness Codex di OpenClaw e vuoi
promuovere deliberatamente risorse personali utili della CLI Codex. Gli avvii
locali del server app Codex usano directory `CODEX_HOME` e `HOME` per agente, quindi
non leggono lo stato personale della CLI Codex per impostazione predefinita.

L'esecuzione di `openclaw migrate codex` in un terminale interattivo mostra
l'anteprima del piano completo, poi apre un selettore con caselle di controllo per gli elementi
di copia delle skill prima della conferma finale di apply. Usa `Toggle all on` o `Toggle all off` per la selezione in blocco;
le skill pianificate partono selezionate, le skill in conflitto partono deselezionate e `Skip for now`
lascia le skill invariate senza applicare. Per esecuzioni tramite script o esatte, passa
`--skill <name>` una volta per skill, ad esempio:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Cosa importa Codex

- Directory delle skill della CLI Codex sotto `$CODEX_HOME/skills`, esclusa la
  cache `.system` di Codex.
- AgentSkills personali sotto `$HOME/.agents/skills`, copiate nello spazio di lavoro
  dell'agente OpenClaw corrente quando vuoi la proprietà per agente.

### Stato Codex da rivedere manualmente

I plugin nativi Codex, `config.toml` e `hooks/hooks.json` nativo non vengono
attivati automaticamente. I plugin possono esporre server MCP, app, hook o altri
comportamenti eseguibili, quindi il provider li segnala per revisione invece di caricarli
in OpenClaw. I file di configurazione e hook vengono copiati nel report di migrazione
per la revisione manuale.

## Provider Hermes

Il provider Hermes incluso rileva lo stato in `~/.hermes` per impostazione predefinita. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- Configurazione del modello predefinito da `config.yaml`.
- Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell'agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Impostazioni predefinite della configurazione della memoria per la memoria su file OpenClaw, più elementi archiviati o da rivedere manualmente per provider di memoria esterni come Honcho.
- Skill che includono un file `SKILL.md` sotto `skills/<name>/`.
- Valori di configurazione per skill da `skills.config`.
- Chiavi API supportate da `.env`, solo con `--include-secrets`.

### Chiavi `.env` supportate

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stato solo archiviato

Lo stato Hermes che OpenClaw non può interpretare in sicurezza viene copiato nel report di migrazione per la revisione manuale, ma non viene caricato nella configurazione o nelle credenziali OpenClaw attive. Questo conserva lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo attendibile automaticamente:

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

Le sorgenti di migrazione sono plugin. Un plugin dichiara i propri id provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

A runtime il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Core possiede l'orchestrazione della CLI, la policy di backup, i prompt, l'output JSON e il preflight dei conflitti. Core passa il piano revisionato a `apply(ctx, plan)` e i provider possono ricreare il piano solo quando quell'argomento è assente per compatibilità.

I plugin provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi riepilogativi, più `openclaw/plugin-sdk/migration-runtime` per copie di file consapevoli dei conflitti, copie nel report solo archiviate, wrapper della configurazione runtime memorizzati nella cache e report di migrazione.

## Integrazione con l'onboarding

L'onboarding può offrire la migrazione quando un provider rileva una sorgente nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione plugin e mostrano comunque un'anteprima prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una configurazione OpenClaw nuova. Reimposta prima configurazione, credenziali, sessioni e spazio di lavoro se hai già uno stato locale. Le importazioni con backup più sovrascrittura o merge sono protette da feature gate per le configurazioni esistenti.
</Note>

## Correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): guida dettagliata rivolta agli utenti.
- [Migrazione da Claude](/it/install/migrating-claude): guida dettagliata rivolta agli utenti.
- [Migrazione](/it/install/migrating): sposta OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo l'applicazione di una migrazione.
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
