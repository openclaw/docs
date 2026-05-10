---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un provider di migrazione gestito dal Plugin
summary: Riferimento CLI per `openclaw migrate` (importa lo stato da un altro sistema di agenti)
title: Migrare
x-i18n:
    generated_at: "2026-05-10T19:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema di agenti tramite un provider di migrazione di proprietà di un plugin. I provider inclusi coprono lo stato di Codex CLI, [Claude](/it/install/migrating-claude) e [Hermes](/it/install/migrating-hermes); i plugin di terze parti possono registrare provider aggiuntivi.

<Tip>
Per guide dettagliate rivolte agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L’[hub di migrazione](/it/install/migrating) elenca tutti i percorsi.
</Tip>

## Comandi

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
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
  Crea il piano ed esce senza modificare lo stato.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sostituisce la directory di stato sorgente. Hermes usa `~/.hermes` come impostazione predefinita.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa le credenziali supportate. Disattivato per impostazione predefinita.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente ad apply di sostituire destinazioni esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta la richiesta di conferma. Obbligatorio in modalità non interattiva.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleziona un elemento di copia skill per nome skill o ID elemento. Ripeti il flag per migrare più skill. Se omesso, le migrazioni Codex interattive mostrano un selettore con caselle di spunta e le migrazioni non interattive mantengono tutte le skill pianificate.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleziona un elemento di installazione di plugin Codex per nome plugin o ID elemento. Ripeti il flag per migrare più plugin Codex. Se omesso, le migrazioni Codex interattive mostrano un selettore nativo con caselle di spunta per plugin Codex e le migrazioni non interattive mantengono tutti i plugin pianificati. Questo si applica solo ai plugin Codex `openai-curated` installati dalla sorgente e rilevati dall’inventario dell’app-server Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Salta il backup precedente all’applicazione. Richiede `--force` quando esiste uno stato OpenClaw locale.
</ParamField>
<ParamField path="--force" type="boolean">
  Richiesto insieme a `--no-backup` quando apply rifiuterebbe altrimenti di saltare il backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il piano o il risultato di apply come JSON. Con `--json` e senza `--yes`, apply stampa il piano e non modifica lo stato.
</ParamField>

## Modello di sicurezza

`openclaw migrate` funziona prima in anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima dell’applicazione">
    Il provider restituisce un piano dettagliato per elementi prima che cambi qualsiasi cosa, inclusi conflitti, elementi saltati ed elementi sensibili. I piani JSON, l’output di apply e i report di migrazione oscurano le chiavi annidate che sembrano segreti, come chiavi API, token, header di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra l’anteprima del piano e chiede conferma prima di modificare lo stato, a meno che `--yes` non sia impostato. In modalità non interattiva, apply richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    Apply crea e verifica un backup OpenClaw prima di applicare la migrazione. Se non esiste ancora uno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione può continuare. Per saltare un backup quando lo stato esiste, passa sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    Apply rifiuta di continuare quando il piano presenta conflitti. Esamina il piano, quindi riesegui con `--overwrite` se la sostituzione delle destinazioni esistenti è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory dei report di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    I segreti non vengono mai importati per impostazione predefinita. Usa `--include-secrets` per importare le credenziali supportate.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva lo stato di Claude Code in `~/.claude` per impostazione predefinita. Usa `--from <path>` per importare una home di Claude Code o una radice di progetto specifica.

<Tip>
Per una guida dettagliata rivolta agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- `CLAUDE.md` di progetto e `.claude/CLAUDE.md` nello spazio di lavoro dell’agente OpenClaw.
- `~/.claude/CLAUDE.md` utente aggiunto a `USER.md` dello spazio di lavoro.
- Definizioni di server MCP da `.mcp.json` di progetto, `~/.claude.json` di Claude Code e `claude_desktop_config.json` di Claude Desktop.
- Directory di skill Claude che includono `SKILL.md`.
- File Markdown di comandi Claude convertiti in skill OpenClaw con sola invocazione manuale.

### Stato archiviato e da revisione manuale

Hook, permessi, impostazioni predefinite dell’ambiente, memoria locale, regole con ambito di percorso, subagenti, cache, piani e cronologia di progetto di Claude vengono conservati nel report di migrazione o segnalati come elementi da revisione manuale. OpenClaw non esegue hook, non copia allowlist ampie e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Codex

Il provider Codex incluso rileva lo stato di Codex CLI in `~/.codex` per impostazione predefinita, oppure
in `CODEX_HOME` quando quella variabile d’ambiente è impostata. Usa `--from <path>` per
inventariare una home Codex specifica.

Usa questo provider quando passi all’harness Codex di OpenClaw e vuoi
promuovere deliberatamente risorse personali utili di Codex CLI. Gli avvii locali
dell’app-server Codex usano directory `CODEX_HOME` e `HOME` per agente, quindi non leggono
lo stato personale di Codex CLI per impostazione predefinita.

L’esecuzione di `openclaw migrate codex` in un terminale interattivo mostra l’anteprima del piano
completo, quindi apre selettori con caselle di spunta prima della conferma finale di apply. Gli elementi
di copia skill vengono richiesti per primi. Usa `Toggle all on` o `Toggle all off` per la selezione in blocco;
le skill pianificate partono selezionate, le skill in conflitto partono deselezionate e
`Skip for now` salta le copie di skill per questa esecuzione continuando comunque con la selezione
dei plugin. Quando plugin Codex curati installati dalla sorgente sono migrabili e
`--plugin` non è stato fornito, la migrazione chiede quindi l’attivazione di plugin Codex nativi
per nome plugin. Gli elementi plugin
partono selezionati a meno che la configurazione del plugin Codex OpenClaw di destinazione abbia già quel
plugin. I plugin di destinazione esistenti partono deselezionati e mostrano un suggerimento di conflitto come
`conflict: plugin exists`; scegli `Toggle all off` per non migrare nessun plugin Codex nativo
in quell’esecuzione, oppure `Skip for now` per fermarti prima dell’applicazione. Per esecuzioni scriptate o
esatte, passa `--skill <name>` una volta per skill, ad esempio:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` per limitare in modo non interattivo la migrazione dei plugin Codex nativi
a uno o più plugin curati installati dalla sorgente:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Cosa importa Codex

- Directory di skill Codex CLI sotto `$CODEX_HOME/skills`, escludendo la cache
  `.system` di Codex.
- AgentSkills personali sotto `$HOME/.agents/skills`, copiati nello spazio di lavoro
  dell’agente OpenClaw corrente quando vuoi una proprietà per agente.
- Plugin Codex `openai-curated` installati dalla sorgente e rilevati tramite
  `plugin/list` dell’app-server Codex. Apply chiama `plugin/install` dell’app-server per ogni
  plugin selezionato, anche se l’app-server di destinazione segnala già quel plugin come
  installato e abilitato. I plugin Codex migrati sono utilizzabili solo nelle sessioni che
  selezionano l’harness Codex nativo; non sono esposti a Pi, alle normali esecuzioni del
  provider OpenAI, ai binding di conversazione ACP o ad altri harness.

### Stato Codex da revisione manuale

`config.toml` di Codex, `hooks/hooks.json` nativo, marketplace non curati e
bundle di plugin memorizzati nella cache che non sono plugin curati installati dalla sorgente non vengono
attivati automaticamente. Vengono copiati o segnalati nel report di migrazione per
revisione manuale.

Per i plugin curati installati dalla sorgente migrati, apply scrive:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- una voce plugin esplicita con `marketplaceName: "openai-curated"` e
  `pluginName` per ogni plugin selezionato

La migrazione non scrive mai `plugins["*"]` e non memorizza mai percorsi di cache
di marketplace locali. Le installazioni che richiedono autenticazione vengono segnalate sull’elemento plugin interessato con
`status: "skipped"`, `reason: "auth_required"` e identificatori app sanificati.
Le relative voci di configurazione esplicite vengono scritte disabilitate finché non riautorizzi e
le abiliti. Altri errori di installazione sono risultati `error` con ambito di elemento.

Se l’inventario dei plugin dell’app-server Codex non è disponibile durante la pianificazione, la migrazione
ripiega su elementi consultivi da bundle memorizzati nella cache invece di far fallire l’intera
migrazione.

## Provider Hermes

Il provider Hermes incluso rileva lo stato in `~/.hermes` per impostazione predefinita. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- Configurazione del modello predefinito da `config.yaml`.
- Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Definizioni di server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell’agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Impostazioni predefinite di configurazione memoria per la memoria file OpenClaw, più elementi archiviati o da revisione manuale per provider di memoria esterni come Honcho.
- Skill che includono un file `SKILL.md` sotto `skills/<name>/`.
- Valori di configurazione per skill da `skills.config`.
- Chiavi API supportate da `.env`, solo con `--include-secrets`.

### Chiavi `.env` supportate

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Stato solo archivio

Lo stato Hermes che OpenClaw non può interpretare in sicurezza viene copiato nel report di migrazione per revisione manuale, ma non viene caricato nella configurazione o nelle credenziali OpenClaw attive. Questo conserva lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo attendibile automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Dopo l’applicazione

```bash
openclaw doctor
```

## Contratto dei plugin

Le sorgenti di migrazione sono plugin. Un plugin dichiara i propri ID provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

A runtime il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Il core possiede l’orchestrazione CLI, la policy di backup, le richieste, l’output JSON e il preflight dei conflitti. Il core passa il piano revisionato in `apply(ctx, plan)`, e i provider possono ricreare il piano solo quando quell’argomento è assente per compatibilità.

I plugin provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi di riepilogo, più `openclaw/plugin-sdk/migration-runtime` per copie di file consapevoli dei conflitti, copie di report solo archivio, wrapper di config-runtime memorizzati nella cache e report di migrazione.

## Integrazione onboarding

L’onboarding può offrire la migrazione quando un provider rileva una sorgente nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione plugin e mostrano comunque un’anteprima prima dell’applicazione.

<Note>
Le importazioni di onboarding richiedono una configurazione OpenClaw nuova. Reimposta prima configurazione, credenziali, sessioni e workspace se hai già uno stato locale. Le importazioni con backup e sovrascrittura o con unione sono protette da feature gate per le configurazioni esistenti.
</Note>

## Correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): procedura guidata rivolta agli utenti.
- [Migrazione da Claude](/it/install/migrating-claude): procedura guidata rivolta agli utenti.
- [Migrazione](/it/install/migrating): sposta OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo di integrità dopo aver applicato una migrazione.
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
