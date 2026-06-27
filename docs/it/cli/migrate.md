---
read_when:
    - Vuoi migrare da Hermes o da un altro sistema di agenti a OpenClaw
    - Stai aggiungendo un provider di migrazione di proprietà del Plugin
summary: Riferimento CLI per `openclaw migrate` (importa lo stato da un altro sistema di agenti)
title: Migrazione
x-i18n:
    generated_at: "2026-06-27T17:20:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importa lo stato da un altro sistema di agenti tramite un provider di migrazione di proprietà del plugin. I provider inclusi coprono lo stato della Codex CLI, [Claude](/it/install/migrating-claude) e [Hermes](/it/install/migrating-hermes); i plugin di terze parti possono registrare provider aggiuntivi.

<Tip>
Per le guide dettagliate rivolte agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude) e [Migrazione da Hermes](/it/install/migrating-hermes). L'[hub di migrazione](/it/install/migrating) elenca tutti i percorsi.
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
  Importa le credenziali supportate senza chiedere conferma. L'applicazione interattiva chiede prima di importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita; `--yes` non interattivo richiede `--include-secrets` per importarle.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Salta l'importazione delle credenziali di autenticazione, incluso il prompt interattivo.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Consente all'applicazione di sostituire le destinazioni esistenti quando il piano segnala conflitti.
</ParamField>
<ParamField path="--yes" type="boolean">
  Salta il prompt di conferma. Obbligatorio in modalità non interattiva.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleziona un elemento di copia Skill per nome Skill o ID elemento. Ripeti il flag per migrare più Skill. Quando omesso, le migrazioni Codex interattive mostrano un selettore con caselle di controllo e le migrazioni non interattive mantengono tutte le Skill pianificate.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleziona un elemento di installazione plugin Codex per nome plugin o ID elemento. Ripeti il flag per migrare più plugin Codex. Quando omesso, le migrazioni Codex interattive mostrano un selettore con caselle di controllo per plugin Codex nativi e le migrazioni non interattive mantengono tutti i plugin pianificati. Questo vale solo per i plugin Codex `openai-curated` installati dalla sorgente e scoperti dall'inventario del server app Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Solo Codex. Forza un attraversamento fresco di `app/list` del server app Codex sorgente prima di pianificare l'attivazione nativa dei plugin. Disattivato per impostazione predefinita per mantenere rapida la pianificazione della migrazione.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Salta il backup prima dell'applicazione. Richiede `--force` quando esiste uno stato OpenClaw locale.
</ParamField>
<ParamField path="--force" type="boolean">
  Obbligatorio insieme a `--no-backup` quando l'applicazione altrimenti rifiuterebbe di saltare il backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il piano o il risultato dell'applicazione come JSON. Con `--json` e senza `--yes`, l'applicazione stampa il piano e non modifica lo stato.
</ParamField>

## Modello di sicurezza

`openclaw migrate` dà priorità all'anteprima.

<AccordionGroup>
  <Accordion title="Anteprima prima dell'applicazione">
    Il provider restituisce un piano dettagliato per elemento prima che venga modificato qualcosa, inclusi conflitti, elementi saltati ed elementi sensibili. I piani JSON, l'output di applicazione e i report di migrazione oscurano le chiavi annidate che sembrano segreti, come chiavi API, token, header di autorizzazione, cookie e password.

    `openclaw migrate apply <provider>` mostra l'anteprima del piano e chiede conferma prima di modificare lo stato, a meno che non sia impostato `--yes`. In modalità non interattiva, l'applicazione richiede `--yes`.

  </Accordion>
  <Accordion title="Backup">
    L'applicazione crea e verifica un backup OpenClaw prima di applicare la migrazione. Se non esiste ancora alcuno stato OpenClaw locale, il passaggio di backup viene saltato e la migrazione può continuare. Per saltare un backup quando lo stato esiste, passa sia `--no-backup` sia `--force`.
  </Accordion>
  <Accordion title="Conflitti">
    L'applicazione rifiuta di continuare quando il piano contiene conflitti. Esamina il piano, quindi riesegui con `--overwrite` se sostituire le destinazioni esistenti è intenzionale. I provider possono comunque scrivere backup a livello di elemento per i file sovrascritti nella directory dei report di migrazione.
  </Accordion>
  <Accordion title="Segreti">
    L'applicazione interattiva chiede se importare le credenziali di autenticazione rilevate, con sì selezionato per impostazione predefinita. Usa `--no-auth-credentials` per saltarle, oppure usa `--include-secrets` per l'importazione automatica delle credenziali con `--yes`.
  </Accordion>
</AccordionGroup>

## Provider Claude

Il provider Claude incluso rileva lo stato di Claude Code in `~/.claude` per impostazione predefinita. Usa `--from <path>` per importare una home Claude Code o una radice di progetto specifica.

<Tip>
Per una guida dettagliata rivolta agli utenti, consulta [Migrazione da Claude](/it/install/migrating-claude).
</Tip>

### Cosa importa Claude

- `CLAUDE.md` del progetto e `.claude/CLAUDE.md` nello spazio di lavoro dell'agente OpenClaw.
- `~/.claude/CLAUDE.md` dell'utente aggiunto a `USER.md` dello spazio di lavoro.
- Definizioni dei server MCP da `.mcp.json` del progetto, Claude Code `~/.claude.json` e Claude Desktop `claude_desktop_config.json`.
- Directory Skill di Claude che includono `SKILL.md`.
- File Markdown dei comandi Claude convertiti in Skill OpenClaw solo con invocazione manuale.

### Stato archiviato e da revisione manuale

Hook Claude, autorizzazioni, valori predefiniti dell'ambiente, memoria locale, regole con ambito di percorso, subagenti, cache, piani e cronologia del progetto vengono conservati nel report di migrazione o segnalati come elementi da revisione manuale. OpenClaw non esegue hook, non copia allowlist ampie e non importa automaticamente lo stato delle credenziali OAuth/Desktop.

## Provider Codex

Il provider Codex incluso rileva lo stato della Codex CLI in `~/.codex` per impostazione predefinita, oppure
in `CODEX_HOME` quando tale variabile d'ambiente è impostata. Usa `--from <path>` per
inventariare una home Codex specifica.

Usa questo provider quando passi all'harness Codex di OpenClaw e vuoi
promuovere deliberatamente risorse personali utili della Codex CLI. Gli avvii
del server app Codex locale usano un `CODEX_HOME` per agente, quindi non leggono
il tuo `~/.codex` personale per impostazione predefinita. Il normale `HOME` del
processo viene comunque ereditato, quindi Codex può vedere Skill condivise in
`$HOME/.agents/*`, voci del marketplace dei plugin e i sottoprocessi possono
trovare configurazioni e token nella home dell'utente.

Eseguire `openclaw migrate codex` in un terminale interattivo mostra l'anteprima del
piano completo, quindi apre selettori con caselle di controllo prima della conferma
finale di applicazione. Gli elementi di copia Skill vengono richiesti per primi.
Usa `Toggle all on` o `Toggle all off` per la selezione in blocco. Premi Spazio
per attivare o disattivare le righe, oppure premi Invio per attivare la riga
evidenziata e continuare. Le Skill pianificate partono selezionate, le Skill in
conflitto partono deselezionate e `Skip for now` salta le copie Skill per questa
esecuzione continuando comunque alla selezione dei plugin. Quando i plugin Codex
curati installati dalla sorgente sono migrabili e `--plugin` non è stato fornito,
la migrazione chiede quindi l'attivazione del plugin Codex nativo per nome plugin.
Gli elementi plugin partono selezionati, a meno che la configurazione del plugin
Codex OpenClaw di destinazione non contenga già quel plugin. I plugin di
destinazione esistenti partono deselezionati e mostrano un suggerimento di
conflitto come `conflict: plugin exists`; scegli `Toggle all off` per non
migrare alcun plugin Codex nativo in quell'esecuzione, oppure `Skip for now` per
fermarti prima dell'applicazione. Per esecuzioni con script o precise, passa
`--skill <name>` una volta per Skill, ad esempio:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Usa `--plugin <name>` per limitare in modo non interattivo la migrazione dei plugin
Codex nativi a uno o più plugin curati installati dalla sorgente:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Cosa importa Codex

- Directory Skill della Codex CLI sotto `$CODEX_HOME/skills`, esclusa la cache
  `.system` di Codex.
- AgentSkills personali sotto `$HOME/.agents/skills`, copiati nello spazio di
  lavoro dell'agente OpenClaw corrente quando vuoi proprietà per agente.
- Plugin Codex `openai-curated` installati dalla sorgente, scoperti tramite
  `plugin/list` del server app Codex. La pianificazione legge `plugin/read` per ogni
  plugin installato abilitato. I plugin supportati da app richiedono che la risposta
  dell'account del server app Codex sorgente sia un account con abbonamento ChatGPT;
  risposte dell'account non ChatGPT o mancanti vengono saltate con
  `codex_subscription_required`. Per impostazione predefinita, la migrazione non
  chiama `app/list` sorgente, quindi i plugin supportati da app che superano il
  controllo dell'account vengono pianificati senza verifica dell'accessibilità
  dell'app sorgente, e gli errori di trasporto nella ricerca dell'account vengono
  saltati con `codex_account_unavailable`. Passa `--verify-plugin-apps` quando vuoi
  che la migrazione forzi uno snapshot fresco di `app/list` sorgente e richieda che
  ogni app posseduta sia presente, abilitata e accessibile prima di pianificare
  l'attivazione nativa. In tale modalità, gli errori di trasporto nella ricerca
  dell'account passano alla verifica dell'inventario app sorgente. Lo snapshot
  dell'inventario app sorgente viene mantenuto in memoria per il processo corrente;
  non viene scritto nell'output di migrazione o nella configurazione di destinazione.
  Plugin disabilitati, dettagli plugin illeggibili, account sorgente bloccati da
  abbonamento e, quando la verifica è richiesta, app mancanti, app disabilitate,
  app inaccessibili o errori dell'inventario app sorgente diventano elementi manuali
  saltati con motivazioni tipizzate invece di voci nella configurazione di
  destinazione.
  L'applicazione chiama `plugin/install` del server app per ogni plugin idoneo
  selezionato, anche se il server app di destinazione segnala già quel plugin come
  installato e abilitato. I plugin Codex migrati sono utilizzabili solo nelle sessioni
  che selezionano l'harness Codex nativo; non sono esposti alle esecuzioni del provider
  OpenClaw, ai binding di conversazione ACP o ad altri harness.

### Stato Codex da revisione manuale

Codex `config.toml`, `hooks/hooks.json` nativo, marketplace non curati, bundle
plugin memorizzati nella cache che non sono plugin curati installati dalla sorgente
e plugin installati dalla sorgente che non superano il controllo dell'abbonamento
sorgente non vengono attivati automaticamente. Quando `--verify-plugin-apps` è
impostato, vengono saltati anche i plugin che non superano il controllo
dell'inventario app sorgente. Vengono copiati o segnalati nel report di migrazione
per revisione manuale.

Per i plugin curati installati dalla sorgente migrati, l'applicazione scrive:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- una voce plugin esplicita con `marketplaceName: "openai-curated"` e
  `pluginName` per ogni plugin selezionato

La migrazione non scrive mai `plugins["*"]` e non archivia mai percorsi della cache locale del marketplace. Gli errori di sottoscrizione lato origine vengono segnalati sugli elementi manuali con motivi tipizzati come `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` o `plugin_read_unavailable`. Con `--verify-plugin-apps`, gli errori dell'inventario app di origine possono apparire anche come `app_inaccessible`, `app_disabled`, `app_missing` o `app_inventory_unavailable`. I plugin saltati non vengono scritti nella configurazione di destinazione.
Le installazioni lato destinazione che richiedono autenticazione vengono segnalate sull'elemento plugin interessato con `status: "skipped"`, `reason: "auth_required"` e identificatori app sanificati. Le relative voci di configurazione esplicite vengono scritte come disabilitate finché non le riautorizzi e le abiliti. Gli altri errori di installazione sono risultati `error` con ambito sull'elemento.

Se l'inventario dei plugin app-server di Codex non è disponibile durante la pianificazione, la migrazione ripiega sugli elementi di avviso del bundle memorizzati nella cache invece di far fallire l'intera migrazione.

## Provider Hermes

Il provider Hermes incluso rileva lo stato in `~/.hermes` per impostazione predefinita. Usa `--from <path>` quando Hermes si trova altrove.

### Cosa importa Hermes

- Configurazione del modello predefinita da `config.yaml`.
- Provider di modelli configurati ed endpoint personalizzati compatibili con OpenAI da `providers` e `custom_providers`.
- Definizioni dei server MCP da `mcp_servers` o `mcp.servers`.
- `SOUL.md` e `AGENTS.md` nello spazio di lavoro dell'agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` aggiunti ai file di memoria dello spazio di lavoro.
- Valori predefiniti della configurazione di memoria per la memoria su file di OpenClaw, più elementi di archivio o revisione manuale per provider di memoria esterni come Honcho.
- Skills che includono un file `SKILL.md` in `skills/<name>/`.
- Valori di configurazione per Skills da `skills.config`.
- Credenziali OAuth OpenAI di OpenCode da `auth.json` di OpenCode quando la migrazione interattiva delle credenziali viene accettata, oppure quando `--include-secrets` è impostato. Le voci OAuth di Hermes `auth.json` sono stato legacy segnalato per la riautenticazione manuale OpenAI o la riparazione tramite doctor.
- Chiavi API e token supportati da Hermes `.env` e OpenCode `auth.json` quando la migrazione interattiva delle credenziali viene accettata, oppure quando `--include-secrets` è impostato.

### Chiavi `.env` supportate

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Stato solo archivio

Lo stato di Hermes che OpenClaw non può interpretare in modo sicuro viene copiato nel report di migrazione per la revisione manuale, ma non viene caricato nella configurazione o nelle credenziali OpenClaw attive. Questo conserva lo stato opaco o non sicuro senza fingere che OpenClaw possa eseguirlo o considerarlo attendibile automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Dopo l'applicazione

```bash
openclaw doctor
```

## Contratto del plugin

Le origini di migrazione sono plugin. Un plugin dichiara i propri ID provider in `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

A runtime, il plugin chiama `api.registerMigrationProvider(...)`. Il provider implementa `detect`, `plan` e `apply`. Il core gestisce l'orchestrazione della CLI, la politica di backup, i prompt, l'output JSON e la verifica preliminare dei conflitti. Il core passa il piano revisionato a `apply(ctx, plan)` e i provider possono ricostruire il piano solo quando quell'argomento è assente per compatibilità.

I plugin provider possono usare `openclaw/plugin-sdk/migration` per la costruzione degli elementi e i conteggi di riepilogo, più `openclaw/plugin-sdk/migration-runtime` per copie di file consapevoli dei conflitti, copie nel report solo archivio, wrapper di config-runtime memorizzati nella cache e report di migrazione.

## Integrazione con l'onboarding

L'onboarding può offrire la migrazione quando un provider rileva un'origine nota. Sia `openclaw onboard --flow import` sia `openclaw setup --wizard --import-from hermes` usano lo stesso provider di migrazione plugin e mostrano comunque un'anteprima prima dell'applicazione.

<Note>
Le importazioni durante l'onboarding richiedono una configurazione OpenClaw nuova. Reimposta prima configurazione, credenziali, sessioni e spazio di lavoro se hai già uno stato locale. Le importazioni backup-più-sovrascrittura o unione sono protette da feature gate per le configurazioni esistenti.
</Note>

## Correlati

- [Migrazione da Hermes](/it/install/migrating-hermes): guida passo passo per l'utente.
- [Migrazione da Claude](/it/install/migrating-claude): guida passo passo per l'utente.
- [Migrazione](/it/install/migrating): sposta OpenClaw su una nuova macchina.
- [Doctor](/it/gateway/doctor): controllo di integrità dopo l'applicazione di una migrazione.
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
