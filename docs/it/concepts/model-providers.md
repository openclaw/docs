---
read_when:
    - Hai bisogno di un riferimento di configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi CLI di onboarding per i provider di modelli
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-05T13:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provider di modelli

Questa pagina copre i **provider LLM/modelli** (non i canali di chat come WhatsApp/Telegram).
Per le regole di selezione dei modelli, vedi [/concepts/models](/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- Se imposti `agents.defaults.models`, diventa la allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Le regole di fallback del runtime, i probe di cooldown e la persistenza delle
  override di sessione sono documentati in
  [/concepts/model-failover](/concepts/model-failover).
- `models.providers.*.models[].contextWindow` è metadato nativo del modello;
  `models.providers.*.models[].contextTokens` è il limite effettivo del runtime.
- I plugin provider possono iniettare cataloghi di modelli tramite `registerProvider({ catalog })`;
  OpenClaw unisce questo output in `models.providers` prima di scrivere
  `models.json`.
- I manifest dei provider possono dichiarare `providerAuthEnvVars` in modo che i
  probe di autenticazione generici basati su env non debbano caricare il runtime del plugin. La mappa rimanente delle env var del core
  ora è solo per provider non plugin/core e per alcuni casi di precedenza generica,
  come l'onboarding Anthropic con priorità alla API key.
- I plugin provider possono anche possedere il comportamento runtime del provider tramite
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, e
  `onModelSelected`.
- Nota: `capabilities` del runtime provider è metadato condiviso del runner (famiglia del provider,
  peculiarità di transcript/tooling, suggerimenti di transport/cache). Non è la
  stessa cosa del [modello di capability pubblico](/plugins/architecture#public-capability-model)
  che descrive ciò che un plugin registra (inferenza testuale, speech, ecc.).

## Comportamento del provider gestito dal plugin

I plugin provider possono ora possedere la maggior parte della logica specifica del provider, mentre OpenClaw mantiene
il loop di inferenza generico.

Suddivisione tipica:

- `auth[].run` / `auth[].runNonInteractive`: il provider possiede i flussi di onboarding/login
  per `openclaw onboard`, `openclaw models auth` e la configurazione headless
- `wizard.setup` / `wizard.modelPicker`: il provider possiede etichette di scelta auth,
  alias legacy, suggerimenti della allowlist di onboarding e voci di configurazione nei selettori di onboarding/modelli
- `catalog`: il provider compare in `models.providers`
- `normalizeModelId`: il provider normalizza id di modelli legacy/preview prima di
  lookup o canonicalizzazione
- `normalizeTransport`: il provider normalizza `api` / `baseUrl` della famiglia di transport
  prima dell'assemblaggio generico del modello; OpenClaw controlla prima il provider corrispondente,
  poi altri plugin provider con hook-capable finché uno non modifica effettivamente il
  transport
- `normalizeConfig`: il provider normalizza la configurazione `models.providers.<id>` prima che
  il runtime la usi; OpenClaw controlla prima il provider corrispondente, poi altri
  plugin provider con hook-capable finché uno non modifica effettivamente la configurazione. Se nessun
  hook provider riscrive la configurazione, gli helper Google-family inclusi
  normalizzano comunque le voci provider Google supportate.
- `applyNativeStreamingUsageCompat`: il provider applica riscritture di compatibilità per l'uso dello streaming nativo guidate dall'endpoint per i provider di configurazione
- `resolveConfigApiKey`: il provider risolve l'autenticazione basata su marker env per i provider di configurazione
  senza forzare il caricamento completo dell'autenticazione runtime. `amazon-bedrock` ha anche un
  resolver integrato qui per marker env AWS, anche se l'autenticazione runtime di Bedrock usa
  la catena predefinita dell'AWS SDK.
- `resolveSyntheticAuth`: il provider può esporre disponibilità di autenticazione
  locale/self-hosted o altra autenticazione supportata dalla configurazione senza persistere segreti in chiaro
- `shouldDeferSyntheticProfileAuth`: il provider può contrassegnare placeholder di profili sintetici memorizzati
  come a priorità inferiore rispetto all'autenticazione supportata da env/config
- `resolveDynamicModel`: il provider accetta id di modelli non ancora presenti nel catalogo statico locale
- `prepareDynamicModel`: il provider ha bisogno di un refresh dei metadati prima di ritentare
  la risoluzione dinamica
- `normalizeResolvedModel`: il provider ha bisogno di riscritture del transport o del base URL
- `contributeResolvedModelCompat`: il provider contribuisce flag di compatibilità per i suoi
  modelli vendor anche quando arrivano tramite un altro transport compatibile
- `capabilities`: il provider pubblica peculiarità di transcript/tooling/famiglia del provider
- `normalizeToolSchemas`: il provider ripulisce gli schemi degli strumenti prima che il runner incorporato
  li veda
- `inspectToolSchemas`: il provider espone avvisi sugli schemi specifici del transport
  dopo la normalizzazione
- `resolveReasoningOutputMode`: il provider sceglie contratti di output reasoning nativi o con tag
- `prepareExtraParams`: il provider imposta valori predefiniti o normalizza parametri di richiesta per modello
- `createStreamFn`: il provider sostituisce il normale percorso di streaming con un transport
  completamente personalizzato
- `wrapStreamFn`: il provider applica wrapper di compatibilità per header/body/modello della richiesta
- `resolveTransportTurnState`: il provider fornisce header o metadati nativi del transport
  per turno
- `resolveWebSocketSessionPolicy`: il provider fornisce header di sessione WebSocket nativi
  o una policy di cool-down della sessione
- `createEmbeddingProvider`: il provider possiede il comportamento degli embedding di memoria quando
  appartiene al plugin provider invece che allo switchboard core degli embedding
- `formatApiKey`: il provider formatta i profili di autenticazione memorizzati nella stringa
  `apiKey` runtime attesa dal transport
- `refreshOAuth`: il provider possiede il refresh OAuth quando i refresher condivisi
  `pi-ai` non bastano
- `buildAuthDoctorHint`: il provider aggiunge indicazioni di riparazione quando il refresh OAuth
  fallisce
- `matchesContextOverflowError`: il provider riconosce errori di overflow della finestra di contesto
  specifici del provider che le euristiche generiche non rileverebbero
- `classifyFailoverReason`: il provider mappa errori raw del transport/API specifici del provider
  a motivi di failover come rate limit o overload
- `isCacheTtlEligible`: il provider decide quali id di modelli upstream supportano il TTL della prompt-cache
- `buildMissingAuthMessage`: il provider sostituisce l'errore generico dell'auth store
  con un suggerimento di recupero specifico del provider
- `suppressBuiltInModel`: il provider nasconde righe upstream obsolete e può restituire un
  errore gestito dal vendor per fallimenti di risoluzione diretta
- `augmentModelCatalog`: il provider aggiunge righe di catalogo sintetiche/finali dopo
  discovery e merge della configurazione
- `isBinaryThinking`: il provider possiede l'esperienza utente di thinking binario on/off
- `supportsXHighThinking`: il provider abilita `xhigh` per modelli selezionati
- `resolveDefaultThinkingLevel`: il provider possiede la policy predefinita di `/think` per una
  famiglia di modelli
- `applyConfigDefaults`: il provider applica valori predefiniti globali specifici del provider
  durante la materializzazione della configurazione in base a modalità auth, env o famiglia di modelli
- `isModernModelRef`: il provider possiede il matching del modello preferito live/smoke
- `prepareRuntimeAuth`: il provider trasforma una credenziale configurata in un token runtime
  a breve durata
- `resolveUsageAuth`: il provider risolve credenziali di utilizzo/quota per `/usage`
  e superfici correlate di stato/reporting
- `fetchUsageSnapshot`: il provider possiede il recupero/parsing dell'endpoint di utilizzo mentre
  il core mantiene comunque shell di riepilogo e formattazione
- `onModelSelected`: il provider esegue effetti collaterali post-selezione come
  telemetria o bookkeeping di sessione gestito dal provider

Esempi inclusi attualmente:

- `anthropic`: fallback forward-compat per Claude 4.6, suggerimenti per la riparazione dell'autenticazione, recupero dell'endpoint
  di utilizzo, metadati cache-TTL/provider-family e valori predefiniti globali
  di configurazione sensibili all'autenticazione
- `amazon-bedrock`: matching dell'overflow del contesto gestito dal provider e classificazione del motivo
  di failover per errori Bedrock-specifici di throttle/non pronto, oltre
  alla famiglia di replay condivisa `anthropic-by-model` per guardrail di replay-policy
  solo-Claude sul traffico Anthropic
- `anthropic-vertex`: guardrail di replay-policy solo-Claude sul traffico
  Anthropic-message
- `openrouter`: id di modelli pass-through, wrapper di richiesta, suggerimenti di capability
  del provider, sanitizzazione della thought-signature Gemini sul traffico Gemini via proxy,
  injection del reasoning via proxy attraverso la famiglia di stream `openrouter-thinking`,
  inoltro dei metadati di routing e policy cache-TTL
- `github-copilot`: onboarding/device login, fallback forward-compat del modello,
  suggerimenti di transcript Claude-thinking, scambio di token runtime e recupero dell'endpoint
  di utilizzo
- `openai`: fallback forward-compat per GPT-5.4, normalizzazione diretta del transport OpenAI,
  suggerimenti di auth mancante sensibili a Codex, soppressione di Spark, righe di catalogo sintetiche
  OpenAI/Codex, policy di thinking/live-model, normalizzazione degli alias dei token d'uso
  (`input` / `output` e famiglie `prompt` / `completion`), la
  famiglia di stream condivisa `openai-responses-defaults` per wrapper nativi OpenAI/Codex
  e metadati provider-family
- `google` e `google-gemini-cli`: fallback forward-compat per Gemini 3.1,
  validazione nativa del replay Gemini, sanitizzazione del replay bootstrap, modalità
  di output reasoning con tag e modern-model matching; Gemini CLI OAuth gestisce anche
  la formattazione dei token del profilo auth, il parsing dei token d'uso e il recupero dell'endpoint di quota
  per le superfici di utilizzo
- `moonshot`: transport condiviso, normalizzazione del payload di thinking gestita dal plugin
- `kilocode`: transport condiviso, header di richiesta gestiti dal plugin, normalizzazione del payload di reasoning,
  sanitizzazione della thought-signature Gemini via proxy e policy cache-TTL
- `zai`: fallback forward-compat per GLM-5, valori predefiniti `tool_stream`, policy cache-TTL,
  policy binary-thinking/live-model e auth di utilizzo + recupero della quota;
  gli id sconosciuti `glm-5*` vengono sintetizzati dal template incluso `glm-4.7`
- `xai`: normalizzazione nativa del transport Responses, riscritture dell'alias `/fast` per
  varianti rapide di Grok, `tool_stream` predefinito e ripulitura specifica xAI di schema strumenti /
  payload di reasoning
- `mistral`: metadati di capability gestiti dal plugin
- `opencode` e `opencode-go`: metadati di capability gestiti dal plugin più
  sanitizzazione della thought-signature Gemini via proxy
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` e `volcengine`: solo cataloghi gestiti dal plugin
- `qwen`: cataloghi gestiti dal plugin per modelli testuali più registrazioni provider condivise
  per media-understanding e video-generation per le sue superfici multimodali;
  la generazione video Qwen usa gli endpoint video Standard DashScope con modelli Wan inclusi
  come `wan2.6-t2v` e `wan2.7-r2v`
- `minimax`: cataloghi gestiti dal plugin, selezione ibrida della replay-policy Anthropic/OpenAI
  e logica auth/snapshot dell'utilizzo
- `xiaomi`: cataloghi gestiti dal plugin più logica auth/snapshot dell'utilizzo

Il plugin `openai` incluso ora possiede entrambi gli id provider: `openai` e
`openai-codex`.

Questo copre i provider che rientrano ancora nei normali transport di OpenClaw. Un provider
che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione
separata e più profonda.

## Rotazione delle API key

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singola override live, priorità massima)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e deduplica i valori.
- Le richieste vengono ritentate con la chiave successiva solo in caso di risposte con rate limit (per
  esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, o messaggi periodici di limite di utilizzo).
- I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
- Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Provider integrati (catalogo pi-ai)

OpenClaw include il catalogo pi‑ai. Questi provider non richiedono alcuna
configurazione `models.providers`; basta impostare l'autenticazione e scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singola override)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket di OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione con priorità OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`,
  `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non
  ai proxy generici compatibili con OpenAI
- I percorsi OpenAI nativi mantengono anche `store` di Responses, suggerimenti per la prompt-cache e
  modellazione del payload compatibile con il reasoning OpenAI; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché la API OpenAI live lo rifiuta; Spark è trattato come solo Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singola override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` o `openclaw onboard --auth-choice anthropic-cli`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con API key e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota sulla fatturazione: la documentazione pubblica Claude Code di Anthropic include ancora l'uso diretto di Claude Code nel terminale nei limiti del piano Claude. Separatamente, Anthropic ha comunicato agli utenti OpenClaw il **4 aprile 2026 alle 12:00 PM PT / 8:00 PM BST** che il percorso di login Claude di **OpenClaw** viene conteggiato come utilizzo tramite harness di terze parti e richiede **Extra Usage** fatturato separatamente dall'abbonamento.
- Il setup-token Anthropic è di nuovo disponibile come percorso OpenClaw legacy/manuale. Usalo aspettandoti che Anthropic abbia comunicato agli utenti OpenClaw che questo percorso richiede **Extra Usage**.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Modello di esempio: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche nelle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`,
  `User-Agent`) vengono allegati solo al traffico Codex nativo verso
  `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` rimane disponibile quando il catalogo OAuth Codex lo espone; dipende dai diritti
- `openai-codex/gpt-5.4` mantiene il valore nativo `contextWindow = 1050000` e un valore runtime predefinito `contextTokens = 272000`; puoi sostituire il limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni ospitate in stile abbonamento

- [Qwen Cloud](/providers/qwen): superficie provider Qwen Cloud più mapping degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/providers/minimax): accesso MiniMax Coding Plan tramite OAuth o API key
- [GLM Models](/providers/glm): endpoint Z.AI Coding Plan o API generali

### OpenCode

- Auth: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione opzionale: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singola override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; gli hit della cache Gemini emergono come `cacheRead` in OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il suo flusso OAuth
- Attenzione: Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo aver usato client di terze parti. Esamina i termini di Google e usa un account non critico se scegli di procedere.
- Gemini CLI OAuth è distribuito come parte del plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3.1-pro-preview`
  - Nota: **non** devi incollare un client id o un secret in `openclaw.json`. Il flusso di login della CLI memorizza
    i token nei profili auth sull'host Gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host Gateway.
  - Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'utilizzo ricade su
    `stats`, con `stats.cached` normalizzato in `cacheRead` di OpenClaw.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati a `zai/*`
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modello di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; la discovery live di
  `https://api.kilo.ai/api/gateway/models` può ampliare ulteriormente il catalogo
  runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway,
  non hardcoded in OpenClaw.

Vedi [/providers/kilocode](/providers/kilocode) per i dettagli di configurazione.

### Altri plugin provider inclusi

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modello di esempio: `openrouter/auto`
- OpenClaw applica gli header di attribuzione dell'app documentati da OpenRouter solo quando
  la richiesta punta effettivamente a `openrouter.ai`
- I marker Anthropic `cache_control` specifici di OpenRouter sono analogamente limitati
  ai percorsi OpenRouter verificati, non a URL proxy arbitrari
- OpenRouter resta sul percorso in stile proxy compatibile con OpenAI, quindi il shaping delle richieste solo-OpenAI nativo (`serviceTier`, Responses `store`,
  suggerimenti per la prompt-cache, payload compatibili con il reasoning OpenAI) non viene inoltrato
- I riferimenti OpenRouter supportati da Gemini mantengono solo la sanitizzazione della thought-signature Gemini via proxy;
  la validazione del replay Gemini nativa e le riscritture bootstrap restano disattivate
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modello di esempio: `kilocode/kilo/auto`
- I riferimenti Kilo supportati da Gemini mantengono lo stesso percorso di sanitizzazione
  della thought-signature Gemini via proxy; `kilocode/kilo/auto` e altri suggerimenti
  proxy che non supportano il reasoning saltano l'iniezione del reasoning via proxy
- MiniMax: `minimax` (API key) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`
- Modello di esempio: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- L'onboarding/configurazione con API key di MiniMax scrive definizioni esplicite del modello M2.7 con
  `input: ["text", "image"]`; il catalogo provider incluso mantiene i riferimenti chat
  solo testuali finché non viene materializzata la configurazione di quel provider
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Modello di esempio: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` o `KIMICODE_API_KEY`)
- Modello di esempio: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Modello di esempio: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` o `DASHSCOPE_API_KEY`)
- Modello di esempio: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Modello di esempio: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Modelli di esempio: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Modello di esempio: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Modello di esempio: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Modello di esempio: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Modello di esempio: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Le richieste xAI native incluse usano il percorso xAI Responses
  - `/fast` o `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`,
    `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`
  - `tool_stream` è attivo per impostazione predefinita; imposta
    `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
    disabilitarlo
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Modello di esempio: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - I modelli GLM su Cerebras usano gli id `zai-glm-4.7` e `zai-glm-4.6`.
  - Base URL compatibile con OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modello di esempio Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Vedi [Hugging Face (Inference)](/providers/huggingface).

## Provider tramite `models.providers` (personalizzati/base URL)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o
proxy compatibili con OpenAI/Anthropic.

Molti dei plugin provider inclusi qui sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sostituire
base URL, header o elenco modelli predefiniti.

### Moonshot AI (Kimi)

Moonshot è distribuito come plugin provider incluso. Usa per impostazione predefinita il provider integrato,
e aggiungi una voce esplicita `models.providers.moonshot` solo quando
devi sostituire il base URL o i metadati del modello:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Modello di esempio: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID modello Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding usa l'endpoint compatibile con Anthropic di Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Modello di esempio: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Il legacy `kimi/k2p5` resta accettato come id modello di compatibilità.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornisce accesso a Doubao e ad altri modelli in Cina.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Modello di esempio: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `volcengine/*`
viene registrato contemporaneamente.

Nei selettori dei modelli di onboarding/configurazione, la scelta auth Volcengine privilegia sia
le righe `volcengine/*` sia `volcengine-plan/*`. Se questi modelli non sono ancora caricati,
OpenClaw torna al catalogo non filtrato invece di mostrare un selettore
vuoto con scope sul provider.

Modelli disponibili:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modelli coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (internazionale)

BytePlus ARK fornisce accesso agli stessi modelli di Volcano Engine per gli utenti internazionali.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Modello di esempio: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `byteplus/*`
viene registrato contemporaneamente.

Nei selettori dei modelli di onboarding/configurazione, la scelta auth BytePlus privilegia sia
le righe `byteplus/*` sia `byteplus-plan/*`. Se questi modelli non sono ancora caricati,
OpenClaw torna al catalogo non filtrato invece di mostrare un selettore
vuoto con scope sul provider.

Modelli disponibili:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modelli coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fornisce modelli compatibili con Anthropic dietro il provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Modello di esempio: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax viene configurato tramite `models.providers` perché usa endpoint personalizzati:

- MiniMax OAuth (globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (globale): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il thinking per
impostazione predefinita a meno che non lo imposti esplicitamente, e `/fast on` riscrive
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capability gestite dal plugin:

- I valori predefiniti per testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, gestita dal plugin, su entrambi i percorsi auth MiniMax
- La ricerca web resta sull'id provider `minimax`

### Ollama

Ollama è distribuito come plugin provider incluso e usa l'API nativa di Ollama:

- Provider: `ollama`
- Auth: Nessuna richiesta (server locale)
- Modello di esempio: `ollama/llama3.3`
- Installazione: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installa Ollama, poi scarica un modello:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando effettui l'opt-in con
`OLLAMA_API_KEY`, e il plugin provider incluso aggiunge Ollama direttamente a
`openclaw onboard` e al selettore dei modelli. Vedi [/providers/ollama](/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come plugin provider incluso per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Auth: Facoltativa (dipende dal tuo server)
- Base URL predefinito: `http://127.0.0.1:8000/v1`

Per effettuare l'opt-in al rilevamento automatico in locale (qualsiasi valore funziona se il tuo server non impone autenticazione):

```bash
export VLLM_API_KEY="vllm-local"
```

Poi imposta un modello (sostituisci con uno degli id restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/providers/vllm) per i dettagli.

### SGLang

SGLang è distribuito come plugin provider incluso per server self-hosted
compatibili con OpenAI veloci:

- Provider: `sglang`
- Auth: Facoltativa (dipende dal tuo server)
- Base URL predefinito: `http://127.0.0.1:30000/v1`

Per effettuare l'opt-in al rilevamento automatico in locale (qualsiasi valore funziona se il tuo server non
impone autenticazione):

```bash
export SGLANG_API_KEY="sglang-local"
```

Poi imposta un modello (sostituisci con uno degli id restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Vedi [/providers/sglang](/providers/sglang) per i dettagli.

### Proxy locali (LM Studio, vLLM, LiteLLM, ecc.)

Esempio (compatibile con OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Note:

- Per i provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono facoltativi.
  Se omessi, OpenClaw usa i valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori provider 400 per ruoli `developer` non supportati.
- I percorsi in stile proxy compatibili con OpenAI saltano anche il shaping delle richieste solo-OpenAI nativo: niente `service_tier`, niente `store` di Responses, niente suggerimenti per la prompt-cache, niente modellazione del payload compatibile con il reasoning OpenAI e nessun header nascosto di attribuzione OpenClaw.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
- Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint non nativi `openai-completions`.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [/gateway/configuration](/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Models](/concepts/models) — configurazione dei modelli e alias
- [Failover del modello](/concepts/model-failover) — catene di fallback e comportamento di retry
- [Riferimento configurazione](/gateway/configuration-reference#agent-defaults) — chiavi di configurazione del modello
- [Providers](/providers) — guide di configurazione per provider
