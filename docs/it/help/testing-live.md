---
read_when:
    - Esecuzione degli smoke test per matrice di modelli live / backend CLI / ACP / media-provider
    - Debug della risoluzione delle credenziali dei test live
    - Aggiungere un nuovo test live specifico del provider
sidebarTitle: Live tests
summary: 'Test live (con accesso alla rete): matrice dei modelli, backend CLI, ACP, provider multimediali, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-06-27T17:37:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

Per avvio rapido, runner QA, suite unit/integration e flussi Docker, consulta
[Testing](/it/help/testing). Questa pagina copre le suite di test **live** (che
toccano la rete): matrice dei modelli, backend CLI, ACP e test live dei
provider multimediali, oltre alla gestione delle credenziali.

## Live: comandi di smoke locali

Esporta la chiave del provider necessaria nell'ambiente del processo prima dei
controlli live ad hoc.

Smoke multimediale sicuro:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sicuro di prontezza per chiamata vocale:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` è una prova a secco salvo che sia presente anche `--yes`. Usa
`--yes` solo quando intendi deliberatamente effettuare una vera chiamata di
notifica. Per Twilio, Telnyx e Plivo, un controllo di prontezza riuscito richiede
un URL Webhook pubblico; i fallback local-only loopback/privati sono rifiutati
per progettazione.

## Live: sweep delle capability del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un nodo Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Configurazione precondizionata/manuale (la suite non installa/esegue/associa l'app).
  - Validazione gateway `node.invoke` comando per comando per il nodo Android selezionato.
- Preconfigurazione richiesta:
  - App Android già connessa e associata al gateway.
  - App mantenuta in primo piano.
  - Autorizzazioni/consenso alla cattura concessi per le capability che ti aspetti passino.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli così possiamo isolare i guasti:

- "Modello diretto" ci dice se il provider/modello può rispondere con la chiave data.
- "Gateway smoke" ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli scoperti
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias di modern) per eseguire effettivamente questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 5.1, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=small` per eseguire la allowlist vincolata dei modelli piccoli (route Qwen 8B/9B compatibili con locale, Ollama Gemma, OpenRouter Qwen/GLM e Z.AI GLM)
  - `OPENCLAW_LIVE_MODELS=all` è un alias della allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Le esecuzioni locali Ollama con modelli piccoli usano per impostazione predefinita `http://127.0.0.1:11434`; imposta `OPENCLAW_LIVE_OLLAMA_BASE_URL` solo per endpoint LAN, personalizzati o Ollama Cloud.
  - Gli sweep modern/all e small usano per impostazione predefinita i relativi limiti curati; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep esaustivo dei profili selezionati o un numero positivo per un limite più piccolo.
  - Gli sweep esaustivi usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` per il timeout dell'intero test del modello diretto. Predefinito: 60 minuti.
  - I probe del modello diretto vengono eseguiti con parallelismo a 20 vie per impostazione predefinita; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per sovrascriverlo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre solo **l'archivio profili**
- Perché esiste:
  - Separa "l'API del provider è rotta / la chiave non è valida" da "la pipeline dell'agente gateway è rotta"
  - Contiene piccole regressioni isolate (esempio: replay del reasoning OpenAI Responses/Codex Responses + flussi tool-call)

### Livello 2: Gateway + smoke agente dev (ciò che "@openclaw" fa realmente)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/applicare patch a una sessione `agent:dev:*` (override modello per esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta "significativa" (senza strumenti)
    - una vera invocazione di strumento funziona (probe di lettura)
    - probe di strumenti extra opzionali (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli dei probe (così puoi spiegare rapidamente i guasti):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di `read` il file e restituire il nonce.
  - probe `exec+read`: il test chiede all'agente di scrivere tramite `exec` un nonce in un file temporaneo, poi di leggerlo con `read`.
  - probe immagine: il test allega un PNG generato (cat + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `test/helpers/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M3, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` per eseguire la stessa allowlist vincolata dei modelli piccoli attraverso l'intera pipeline gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias della allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o un elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all e small usano per impostazione predefinita i relativi limiti curati; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep selezionato esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita "tutto OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- I probe di strumenti + immagini sono sempre attivi in questo test live:
  - probe `read` + probe `exec+read` (stress strumenti)
  - il probe immagine viene eseguito quando il modello pubblicizza il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con "CAT" + codice casuale (`test/helpers/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra un messaggio utente multimodale al modello
    - Asserzione: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori consentiti)

<Tip>
Per vedere cosa puoi testare sulla tua macchina (e gli id `provider/model` esatti), esegui:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- I valori predefiniti dello smoke specifici del backend vivono nella definizione `cli-backend.ts` dell'estensione proprietaria.
- Abilita:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comportamento di comando/argomenti/immagini proveniente dai metadati del plugin backend CLI proprietario.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi sono iniettati nel prompt). Le ricette Docker lo disattivano per impostazione predefinita salvo richiesta esplicita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece dell'iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per aderire al probe di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta un target di cambio. Le ricette Docker lo disattivano per impostazione predefinita per l'affidabilità aggregata.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per aderire al probe MCP/tool local loopback. Le ricette Docker lo disattivano per impostazione predefinita salvo richiesta esplicita.

Esempio:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke economico della configurazione MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Questo non chiede a Gemini di generare una risposta. Scrive le stesse
impostazioni di sistema che OpenClaw fornisce a Gemini, poi esegue
`gemini --debug mcp list` per dimostrare che un server salvato
`transport: "streamable-http"` viene normalizzato nella forma HTTP MCP di Gemini
e può connettersi a un server MCP streamable-HTTP locale.

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker a provider singolo:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker vive in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI all'interno dell'immagine Docker del repo come utente non-root `node`.
- Risolve i metadati dello smoke CLI dall'estensione proprietaria, quindi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) in un prefisso scrivibile memorizzato nella cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile per l'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway backend CLI senza preservare le variabili env della chiave API Anthropic. Questa lane di abbonamento disabilita per impostazione predefinita i probe MCP/tool e immagine di Claude perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione per uso extra invece dei normali limiti del piano di abbonamento.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude e Gemini: turno di testo, turno di classificazione immagine, poi chiamata allo strumento MCP `cron` verificata tramite la CLI gateway.
- Lo smoke predefinito di Claude applica anche una patch alla sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: raggiungibilità proxy HTTP/2 APNs

- Test: `src/infra/push-apns-http2.live.test.ts`
- Obiettivo: tunnel attraverso un proxy HTTP CONNECT locale verso l'endpoint APNs sandbox di Apple, inviare la richiesta di validazione HTTP/2 APNs e verificare che la reale risposta `403 InvalidProviderToken` di Apple torni attraverso il percorso proxy.
- Abilita:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opzionale:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il flusso reale di associazione conversazione ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica del canale dei messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilita:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Note:
  - Questa lane usa la superficie Gateway `chat.send` con campi di originating-route sintetici riservati agli amministratori, così i test possono collegare il contesto del canale dei messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l'agente harness ACP selezionato.
  - La creazione MCP Cron della sessione associata è best-effort per impostazione predefinita perché gli harness ACP esterni possono annullare le chiamate MCP dopo che la prova di associazione/immagine è passata; imposta `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` per rendere rigorosa quella sonda Cron post-associazione.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Ricette Docker per singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue il bind smoke ACP contro gli agenti CLI live aggregati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Prepara nel container il materiale di autenticazione CLI corrispondente, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` o `opencode-ai`) se manca. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato dal Plugin `acpx` ufficiale.
- La variante Docker Droid prepara `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede quella chiave API perché l'autenticazione OAuth/keyring locale di Factory non è portabile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode è una lane di regressione rigorosa per singolo agente. Scrive un modello predefinito temporaneo `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predefinito `opencode/kimi-k2.6`) e `pnpm test:docker:live-acp-bind:opencode` richiede una trascrizione dell'assistente associato invece di accettare lo skip generico post-associazione.
- Le chiamate CLI dirette a `acpx` sono solo un percorso manuale/di workaround per confrontare il comportamento fuori dal Gateway. L'ACP bind smoke Docker esercita il backend runtime `acpx` incorporato di OpenClaw.

## Live: smoke harness app-server Codex

- Obiettivo: validare l'harness Codex di proprietà del Plugin tramite il normale metodo Gateway
  `agent`:
  - caricare il Plugin `codex` incluso
  - selezionare `openai/gpt-5.5`, che instrada per impostazione predefinita i turni agente OpenAI attraverso Codex
  - inviare un primo turno agente Gateway a `openai/gpt-5.5` con l'harness Codex selezionato
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server
    possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando Gateway
  - facoltativamente eseguire due sonde shell con escalation revisionate da Guardian: un comando benigno
    che dovrebbe essere approvato e un caricamento di falso segreto che dovrebbe essere
    negato così l'agente chiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilita: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `openai/gpt-5.5`
- Sonda immagine opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke forza provider/modello `agentRuntime.id: "codex"` così un harness Codex rotto
  non può passare ricadendo silenziosamente su OpenClaw.
- Autenticazione: autenticazione app-server Codex dal login locale alla sottoscrizione Codex. Gli smoke Docker
  possono anche fornire `OPENAI_API_KEY` per sonde non Codex quando applicabile,
  più la copia opzionale di `~/.codex/auth.json` e `~/.codex/config.toml`.

Ricetta locale:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Passa `OPENAI_API_KEY`, copia i file di autenticazione della CLI Codex quando presenti, installa
  `@openai/codex` in un prefisso npm montato e scrivibile,
  prepara l'albero sorgente, poi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando ti serve una run di debug più ristretta.
- Docker usa la stessa configurazione runtime Codex esplicita, quindi alias legacy o fallback OpenClaw
  non possono nascondere una regressione dell'harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono le più veloci e le meno instabili:

- Singolo modello, diretto (senza Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profilo diretto small-model:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profilo Gateway small-model:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API smoke:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Singolo modello, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su diversi provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke diretto Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - Predefinito dinamico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- Gemini API vs Gemini CLI:
  - API: OpenClaw chiama l'API Gemini ospitata di Google via HTTP (chiave API / autenticazione del profilo); è ciò che la maggior parte degli utenti intende per "Gemini".
  - CLI: OpenClaw esegue una shell verso un binario `gemini` locale; ha la propria autenticazione e può comportarsi diversamente (supporto streaming/tool/disallineamento versioni).

## Live: matrice modelli (cosa copriamo)

Non esiste una "lista modelli CI" fissa (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è la run dei "modelli comuni" che ci aspettiamo continui a funzionare:

- OpenAI (non Codex): `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1` (API generale) o `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Esegui lo smoke Gateway con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opzionale)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1` (API generale) o `zai/glm-5.2` (Coding Plan)
- MiniMax: `minimax/MiniMax-M3`

Copertura aggiuntiva opzionale (utile da avere):

- xAI: `xai/grok-4.3` (o l'ultimo disponibile)
- Mistral: `mistral/`… (scegli un modello capace di usare "tools" che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Visione: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con capacità di visione, ecc.) per esercitare la sonda immagine.

### Aggregatori / Gateway alternativi

Se hai chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati capaci di tool+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

<Tip>
Non inserire "tutti i modelli" in modo hardcoded nella documentazione. L'elenco autorevole è quello restituito da `discoverModels(...)` sulla tua macchina, più le chiavi disponibili.
</Tip>

## Credenziali (non committare mai)

I test live rilevano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live segnala "nessuna credenziale", esegui il debug nello stesso modo in cui faresti il debug di `openclaw models list` / della selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che significa "chiavi profilo" nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live preparata quando presente, ma non è l'archivio principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory di autenticazione CLI esterne supportate in una home di test temporanea; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override dei percorsi `agents.*.workspace` / `agentDir` vengono rimossi così le sonde restano fuori dal workspace reale del tuo host.

Se vuoi fare affidamento sulle chiavi env, esportale prima dei test locali oppure usa i
runner Docker sotto con un `OPENCLAW_PROFILE_FILE` esplicito.

## Deepgram live (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilita: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Piano di coding BytePlus live

- Test: `extensions/byteplus/live.test.ts`
- Abilita: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override opzionale del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media del workflow ComfyUI live

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esegue i percorsi comfy integrati per immagini, video e `music_generate`
  - Salta ogni capacità a meno che `plugins.entries.comfy.config.<capability>` sia configurato
  - Utile dopo modifiche a invio dei workflow comfy, polling, download o registrazione del plugin

## Generazione immagini live

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Usa le variabili env del provider già esportate prima di eseguire le sonde
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue ogni provider configurato attraverso il runtime condiviso di generazione immagini:
    - `<provider>:generate`
    - `<provider>:edit` quando il provider dichiara il supporto alla modifica
- Provider integrati attualmente coperti:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restringimento opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione tramite archivio profili e ignorare gli override solo env

Per il percorso CLI distribuito, aggiungi uno smoke `infer` dopo che il test live
provider/runtime è passato:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre il parsing degli argomenti CLI, la risoluzione della configurazione/dell'agente predefinito, l'attivazione del
plugin integrato, il runtime condiviso di generazione immagini e la richiesta live al provider.
Le dipendenze del plugin devono essere presenti prima del caricamento del runtime.

## Generazione musica live

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esegue il percorso condiviso dei provider integrati di generazione musica
  - Attualmente copre Google e MiniMax
  - Usa le variabili env del provider già esportate prima di eseguire le sonde
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della corsia condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questa scansione condivisa
- Restringimento opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione tramite archivio profili e ignorare gli override solo env

## Generazione video live

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esegue il percorso condiviso dei provider integrati di generazione video
  - Per impostazione predefinita usa il percorso smoke sicuro per la release: provider non FAL, una richiesta text-to-video per provider, prompt di un secondo con aragosta e un limite operativo per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Usa le variabili env del provider già esportate prima di eseguire le sonde
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nella scansione condivisa
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nella scansione condivisa
  - Provider `imageToVideo` attualmente dichiarati ma saltati nella scansione condivisa:
    - `vydra` perché `veo3` integrato è solo testo e `kling` integrato richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una corsia `kling` che usa per impostazione predefinita una fixture con URL immagine remoto
  - Copertura live `videoToVideo` attuale:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nella scansione condivisa:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché la corsia Gemini/Veo condivisa attuale usa input locale basato su buffer e quel percorso non è accettato nella scansione condivisa
    - `openai` perché l'attuale corsia condivisa non ha garanzie di accesso alla modifica video specifiche dell'organizzazione
- Restringimento opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nella scansione predefinita, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite operativo di ogni provider per un'esecuzione smoke aggressiva
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione tramite archivio profili e ignorare gli override solo env

## Harness media live

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise per immagini, musica e video tramite un unico entrypoint nativo del repo
  - Usa le variabili env del provider già esportate
  - Per impostazione predefinita restringe automaticamente ogni suite ai provider che attualmente hanno autenticazione utilizzabile
  - Riusa `scripts/test-live.mjs`, quindi il comportamento di Heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Correlati

- [Test](/it/help/testing) - suite unit, integrazione, QA e Docker
