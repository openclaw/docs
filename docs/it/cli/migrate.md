---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un provider di migrazione gestito dal plugin
summary: Riferimento CLI per `openclaw migrate` (importazione dello stato da un altro sistema di agenti)
title: Migra
x-i18n:
    generated_at: "2026-07-12T06:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema di agenti tramite un provider di migrazione gestito da un plugin. I provider inclusi supportano Claude, Codex CLI e [Hermes](/it/install/migrating-hermes); i plugin possono registrare provider aggiuntivi.

<Tip>
Per le procedure guidate rivolte agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L'[hub delle migrazioni](/it/install/migrating) elenca tutti i percorsi.
</Tip>

## Comandi

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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

L'esecuzione di `openclaw migrate <provider>` senza altri flag crea il piano, mostra un'anteprima e, in una TTY, chiede conferma prima dell'applicazione. `openclaw migrate plan <provider>` e `openclaw migrate apply <provider>` separano l'anteprima e l'applicazione in sottocomandi distinti con gli stessi flag.

<ParamField path="<provider>" type="string">
  Nome di un provider di migrazione registrato, ad esempio `hermes`. Esegui `openclaw migrate list` per visualizzare i provider installati.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Genera il piano ed esce senza modificare lo stato.
</ParamField>
<ParamField path="--from <path>" type="string">
  Sostituisce la directory dello stato sorgente. Il valore predefinito di Hermes è `~/.hermes`, quello di Codex è `~/.codex` (o `$CODEX_HOME`), quello di Claude è `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa le credenziali supportate senza chiedere conferma. L'applicazione interattiva chiede conferma prima di importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita; in modalità non interattiva, `--yes` richiede `--include-secrets` per importarle.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignora l'importazione delle credenziali di autenticazione, inclusa la richiesta interattiva.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente all'applicazione di sostituire le destinazioni esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta la richiesta di conferma. Obbligatorio in modalità non interattiva.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleziona un elemento di copia di una skill tramite il nome della skill o l'ID dell'elemento. Ripeti il flag per migrare più skill. Se omesso, le migrazioni interattive di Codex mostrano un selettore con caselle di controllo, mentre quelle non interattive mantengono tutte le skill pianificate.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleziona un elemento di installazione di un plugin Codex tramite il nome del plugin o l'ID dell'elemento. Ripeti il flag per migrare più plugin Codex. Se omesso, le migrazioni interattive di Codex mostrano un selettore nativo con caselle di controllo per i plugin Codex, mentre quelle non interattive mantengono tutti i plugin pianificati. Si applica solo ai plugin Codex `openai-curated` installati dalla sorgente e rilevati dall'inventario dell'app-server Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo Codex. Forza un nuovo attraversamento `app/list` dell'app-server Codex sorgente prima di pianificare l'attivazione nativa dei plugin. Disattivato per impostazione predefinita per mantenere rapida la pianificazione della migrazione.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Percorso o directory dell'archivio di backup precedente alla migrazione. Viene passato a `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Salta il backup precedente all'applicazione. Richiede `--force` quando esiste uno stato OpenClaw locale.
</ParamField>
<ParamField path="--force" type="boolean">
  Obbligatorio insieme a `--no-backup` quando, altrimenti, l'applicazione rifiuterebbe di saltare il backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il piano o il risultato dell'applicazione in formato JSON. Con `--json` e senza `--yes`, l'applicazione stampa il piano e non modifica lo stato.
</ParamField>

## Modello di sicurezza

`openclaw migrate` mostra prima l'anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima dell'applicazione">
    Il provider restituisce un piano dettagliato per elementi prima di qualsiasi modifica, inclusi conflitti, elementi ignorati ed elementi sensibili. I piani JSON, l'output dell'applicazione e i rapporti di migrazione oscurano le chiavi annidate che sembrano contenere segreti, come chiavi API, token, intestazioni di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra l'anteprima del piano e chiede conferma prima di modificare lo stato, a meno che non sia impostato `--yes`. In modalità non interattiva, l'applicazione richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    Prima di applicare la migrazione, l'applicazione crea e verifica un backup di OpenClaw. Se non esiste ancora uno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione prosegue. Per saltare il backup quando esiste uno stato, specifica sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    L'applicazione rifiuta di proseguire quando il piano presenta conflitti. Esamina il piano, quindi esegui nuovamente il comando con `--overwrite` se la sostituzione delle destinazioni esistenti è intenzionale. I provider possono comunque creare backup a livello di elemento per i file sovrascritti nella directory del rapporto di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    L'applicazione interattiva chiede se importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita. Usa `--no-auth-credentials` per ignorarle oppure `--include-secrets` per importare le credenziali senza supervisione con `--yes`.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva per impostazione predefinita lo stato di Claude Code in `~/.claude`. Usa `--from <path>` per importare una specifica directory home o radice di progetto di Claude Code.

<Tip>
Per una procedura guidata rivolta agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- I file di progetto `CLAUDE.md` e `.claude/CLAUDE.md` nell'area di lavoro dell'agente OpenClaw (`AGENTS.md`).
- Il file utente `~/.claude/CLAUDE.md` aggiunto a `USER.md` nell'area di lavoro.
- Le definizioni dei server MCP dal file di progetto `.mcp.json`, da `~/.claude.json` di Claude Code (incluse le relative voci per progetto) e da `claude_desktop_config.json` di Claude Desktop.
- Le directory delle skill di Claude che includono `SKILL.md` (`~/.claude/skills` dell'utente e `.claude/skills` del progetto).
- I file Markdown dei comandi di Claude (`~/.claude/commands` dell'utente e `.claude/commands` del progetto), convertiti in skill OpenClaw richiamabili solo manualmente.

### Stato archiviato e da esaminare manualmente

Gli hook, le autorizzazioni, i valori predefiniti dell'ambiente, il file di progetto `CLAUDE.local.md`, `.claude/rules`, le directory `agents/` dell'utente e del progetto e la cronologia dei progetti (`projects`, `cache`, `plans` in `~/.claude`) di Claude vengono conservati nel rapporto di migrazione o segnalati come elementi da esaminare manualmente. OpenClaw non esegue gli hook, non copia ampi elenchi di autorizzazioni e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Codex

Il provider Codex incluso rileva per impostazione predefinita lo stato di Codex CLI in `~/.codex` oppure in `CODEX_HOME` quando tale variabile di ambiente è impostata. Usa `--from <path>` per inventariare una specifica directory home di Codex.

Usa questo provider quando passi all'harness Codex di OpenClaw e vuoi trasferire deliberatamente risorse personali utili di Codex CLI. Gli avvii locali dell'app-server Codex usano un `CODEX_HOME` specifico per agente, quindi per impostazione predefinita non leggono il tuo `~/.codex` personale. Il normale `HOME` del processo viene comunque ereditato, quindi Codex può accedere alle voci condivise delle skill e del marketplace dei plugin in `$HOME/.agents/*`, mentre i sottoprocessi possono trovare configurazioni e token nella directory home dell'utente.

L'esecuzione di `openclaw migrate codex` in un terminale interattivo mostra l'anteprima del piano completo, quindi apre i selettori con caselle di controllo prima della conferma finale dell'applicazione. Gli elementi di copia delle skill vengono richiesti per primi. Usa `Toggle all on` o `Toggle all off` per la selezione collettiva. Premi Spazio per attivare o disattivare le righe oppure Invio per attivare la riga evidenziata e continuare. Le skill pianificate sono inizialmente selezionate, quelle in conflitto sono inizialmente deselezionate e `Skip for now` salta la copia delle skill per questa esecuzione, continuando comunque con la selezione dei plugin. Quando sono disponibili per la migrazione plugin Codex curati e installati dalla sorgente e non è stato specificato `--plugin`, la migrazione richiede quindi l'attivazione nativa dei plugin Codex in base al nome del plugin. Gli elementi dei plugin sono inizialmente selezionati, a meno che la configurazione di destinazione dei plugin Codex di OpenClaw non contenga già quel plugin. I plugin già presenti nella destinazione sono inizialmente deselezionati e mostrano un'indicazione di conflitto come `conflict: plugin exists`; scegli `Toggle all off` per non migrare alcun plugin Codex nativo durante tale esecuzione oppure `Skip for now` per interrompere prima dell'applicazione.

Per esecuzioni automatizzate o precise, seleziona esplicitamente una o più skill o plugin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Cosa importa Codex

- Le directory delle skill di Codex CLI in `$CODEX_HOME/skills`, esclusa la cache `.system` di Codex.
- Le AgentSkills personali in `$HOME/.agents/skills`, copiate nell'area di lavoro dell'agente OpenClaw corrente per assegnarne la proprietà al singolo agente.
- I plugin Codex `openai-curated` installati dalla sorgente e rilevati tramite `plugin/list` dell'app-server Codex. La pianificazione legge `plugin/read` per ogni plugin installato e abilitato.

La migrazione dei plugin supportati da app prevede ulteriori controlli:

- I plugin supportati da app richiedono che l'account dell'app-server Codex sorgente sia un account con abbonamento ChatGPT. Le risposte relative ad account non ChatGPT o mancanti vengono ignorate con `codex_subscription_required`.
- Per impostazione predefinita, la migrazione non chiama `app/list` sulla sorgente; pertanto, i plugin supportati da app che superano il controllo dell'account vengono pianificati senza verificare l'accessibilità dell'app sorgente, mentre gli errori di trasporto durante la ricerca dell'account causano l'esclusione con `codex_account_unavailable`.
- Specifica `--verify-plugin-apps` per forzare una nuova istantanea `app/list` della sorgente e richiedere che ogni app posseduta sia presente, abilitata e accessibile prima di pianificare l'attivazione nativa. In questa modalità, gli errori di trasporto durante la ricerca dell'account passano alla verifica dell'inventario delle app sorgente. L'istantanea viene mantenuta in memoria solo per il processo corrente; non viene mai scritta nell'output della migrazione o nella configurazione di destinazione.

I plugin disabilitati, i dettagli dei plugin illeggibili, gli account sorgente soggetti al requisito di abbonamento e, quando è impostato `--verify-plugin-apps`, le app mancanti, disabilitate o inaccessibili diventano elementi ignorati manualmente con motivazioni tipizzate, anziché voci della configurazione di destinazione. L'applicazione chiama `plugin/install` dell'app-server per ogni plugin idoneo selezionato, anche se l'app-server di destinazione segnala già quel plugin come installato e abilitato. I plugin Codex migrati sono utilizzabili solo nelle sessioni che selezionano l'harness Codex nativo; non sono disponibili per le esecuzioni dei provider OpenClaw, le associazioni di conversazioni ACP o altri harness.

### Stato Codex da esaminare manualmente

Il file `config.toml` di Codex, gli `hooks/hooks.json` nativi, i marketplace non curati, i pacchetti di plugin memorizzati nella cache che non sono plugin curati installati dalla sorgente e i plugin installati dalla sorgente che non superano il controllo dell'abbonamento sorgente non vengono attivati automaticamente. Quando è impostato `--verify-plugin-apps`, vengono ignorati anche i plugin che non superano il controllo dell'inventario delle app sorgente. Tutti questi elementi vengono copiati o segnalati nel rapporto di migrazione per l'esame manuale.

Per i plugin curati installati dalla sorgente e migrati, l'applicazione scrive:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una voce esplicita del plugin con `marketplaceName: "openai-curated"` e `pluginName` per ogni plugin selezionato

La migrazione non scrive mai `plugins["*"]` e non memorizza mai i percorsi locali della cache del marketplace.

I plugin ignorati non vengono scritti nella configurazione di destinazione. Gli errori delle sottoscrizioni sul lato sorgente vengono segnalati negli elementi manuali con motivi tipizzati: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, gli errori dell'inventario delle app sul lato sorgente possono essere indicati anche come `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. Le installazioni sul lato destinazione che richiedono l'autenticazione vengono segnalate nell'elemento del plugin interessato con `status: "skipped"`, `reason: "auth_required"` e identificatori delle app anonimizzati; le relative voci di configurazione esplicite vengono scritte come disabilitate finché non vengono riautorizzate e abilitate. Gli altri errori di installazione producono risultati `error` limitati al singolo elemento.

Se l'inventario dei plugin del server applicativo Codex non è disponibile durante la pianificazione, la migrazione utilizza come soluzione di ripiego gli elementi consultivi memorizzati nella cache del bundle, anziché interrompere l'intera migrazione.

## Provider Hermes

Il provider Hermes incluso rileva per impostazione predefinita lo stato in `~/.hermes`. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- La configurazione del modello predefinito da `config.yaml`.
- I provider di modelli configurati e gli endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Le definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell'agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Le impostazioni predefinite della configurazione della memoria per la memoria su file di OpenClaw, oltre a elementi di archiviazione o revisione manuale per provider di memoria esterni come Honcho.
- Le Skills che includono un file `SKILL.md` in `skills/<name>/`.
- I valori di configurazione specifici di ogni Skill da `skills.config`.
- Le credenziali OAuth OpenAI di OpenCode dal file `auth.json` di OpenCode quando viene accettata la migrazione interattiva delle credenziali o quando è impostato `--include-secrets`. Le voci OAuth nel file `auth.json` di Hermes costituiscono uno stato obsoleto segnalato per la riautenticazione manuale con OpenAI o la correzione tramite doctor.
- Le chiavi API e i token supportati dal file `.env` di Hermes e dal file `auth.json` di OpenCode quando viene accettata la migrazione interattiva delle credenziali o quando è impostato `--include-secrets`.

### Chiavi `.env` supportate

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Stato destinato esclusivamente all'archivio

Lo stato di Hermes che OpenClaw non può interpretare in modo sicuro viene copiato nel rapporto di migrazione per la revisione manuale, ma non viene caricato nella configurazione o nelle credenziali attive di OpenClaw. In questo modo viene preservato lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo automaticamente attendibile: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Dopo l'applicazione

```bash
openclaw doctor
```

## Contratto del Plugin

Le sorgenti di migrazione sono plugin. Un plugin dichiara gli ID dei propri provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Durante l'esecuzione, il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Il core gestisce l'orchestrazione della CLI, i criteri di backup, le richieste interattive, l'output JSON e la verifica preliminare dei conflitti. Il core passa il piano revisionato a `apply(ctx, plan)` e, per compatibilità, i provider possono ricostruire il piano solo quando tale argomento è assente.

I plugin dei provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi di riepilogo, oltre a `openclaw/plugin-sdk/migration-runtime` per le copie di file con rilevamento dei conflitti, le copie nel rapporto destinate esclusivamente all'archivio, i wrapper del runtime di configurazione memorizzati nella cache e i rapporti di migrazione.

## Integrazione con l'onboarding

L'onboarding può proporre la migrazione quando un provider rileva una sorgente nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione del plugin e mostrano comunque un'anteprima prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una nuova configurazione di OpenClaw. Se esiste già uno stato locale, reimposta prima la configurazione, le credenziali, le sessioni e lo spazio di lavoro. Le importazioni con backup e sovrascrittura o con unione sono soggette a un flag di funzionalità per le configurazioni esistenti.
</Note>

## Contenuti correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): procedura dettagliata per gli utenti.
- [Migrazione da Claude](/it/install/migrating-claude): procedura dettagliata per gli utenti.
- [Migrazione](/it/install/migrating): trasferimento di OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo dello stato dopo l'applicazione di una migrazione.
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
