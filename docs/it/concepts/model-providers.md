---
read_when:
    - Ti serve un riferimento per la configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi CLI di onboarding per i provider di modelli
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-07T08:13:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9c1f7f8cf09b6047a64189f7440811aafc93d01335f76969afd387cc54c7ab5
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provider di modelli

Questa pagina copre i **provider LLM/modelli** (non i canali di chat come WhatsApp/Telegram).
Per le regole di selezione dei modelli, vedi [/concepts/models](/it/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- Se imposti `agents.defaults.models`, diventa la allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Le regole di fallback del runtime, le probe di cooldown e la persistenza delle override di sessione sono
  documentate in [/concepts/model-failover](/it/concepts/model-failover).
- `models.providers.*.models[].contextWindow` sono metadati nativi del modello;
  `models.providers.*.models[].contextTokens` è il limite effettivo del runtime.
- I plugin provider possono inserire cataloghi di modelli tramite `registerProvider({ catalog })`;
  OpenClaw unisce questo output in `models.providers` prima di scrivere
  `models.json`.
- I manifest dei provider possono dichiarare `providerAuthEnvVars` così le probe generiche
  di autenticazione basate su env non devono caricare il runtime del plugin. La mappa rimanente
  delle variabili env nel core è ora solo per provider non plugin/core e per alcuni casi
  di precedenza generica come l'onboarding Anthropic con priorità alla chiave API.
- I plugin provider possono anche gestire il comportamento runtime specifico del provider tramite
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, and
  `onModelSelected`.
- Nota: le `capabilities` del runtime del provider sono metadati condivisi del runner (famiglia
  del provider, particolarità di transcript/tooling, suggerimenti su transport/cache). Non sono la
  stessa cosa del [modello di capacità pubblico](/it/plugins/architecture#public-capability-model)
  che descrive cosa registra un plugin (inferenza testo, speech, ecc.).

## Comportamento del provider gestito dal plugin

I plugin provider possono ora gestire la maggior parte della logica specifica del provider mentre OpenClaw mantiene
il loop di inferenza generico.

Suddivisione tipica:

- `auth[].run` / `auth[].runNonInteractive`: il provider gestisce i flussi di onboarding/login
  per `openclaw onboard`, `openclaw models auth` e la configurazione headless
- `wizard.setup` / `wizard.modelPicker`: il provider gestisce etichette per la scelta auth,
  alias legacy, suggerimenti di allowlist per onboarding ed elementi di configurazione nei selettori di onboarding/modelli
- `catalog`: il provider compare in `models.providers`
- `normalizeModelId`: il provider normalizza ID modello legacy/preview prima della
  ricerca o canonizzazione
- `normalizeTransport`: il provider normalizza `api` / `baseUrl` della famiglia di transport
  prima dell'assemblaggio generico del modello; OpenClaw controlla prima il provider corrispondente,
  poi altri plugin provider capaci di usare hook finché uno non modifica effettivamente il
  transport
- `normalizeConfig`: il provider normalizza la configurazione `models.providers.<id>` prima che il
  runtime la usi; OpenClaw controlla prima il provider corrispondente, poi altri
  plugin provider capaci di usare hook finché uno non modifica effettivamente la configurazione. Se nessun
  hook provider riscrive la configurazione, gli helper inclusi della famiglia Google continuano a
  normalizzare le voci supportate dei provider Google.
- `applyNativeStreamingUsageCompat`: il provider applica riscritture di compatibilità per l'uso dello streaming nativo guidate dall'endpoint per i provider configurati
- `resolveConfigApiKey`: il provider risolve l'autenticazione con marker env per i provider configurati
  senza forzare il caricamento completo dell'autenticazione runtime. `amazon-bedrock` ha anche un
  resolver integrato di marker env AWS qui, anche se l'autenticazione runtime di Bedrock usa
  la catena predefinita dell'AWS SDK.
- `resolveSyntheticAuth`: il provider può esporre disponibilità di autenticazione locale/self-hosted o altre
  autenticazioni basate su configurazione senza persistere segreti in chiaro
- `shouldDeferSyntheticProfileAuth`: il provider può segnare placeholder di profili sintetici memorizzati
  come con precedenza inferiore rispetto all'autenticazione basata su env/config
- `resolveDynamicModel`: il provider accetta ID modello non ancora presenti nel catalogo statico
  locale
- `prepareDynamicModel`: il provider necessita di un refresh dei metadati prima di ritentare
  la risoluzione dinamica
- `normalizeResolvedModel`: il provider necessita di riscritture di transport o base URL
- `contributeResolvedModelCompat`: il provider contribuisce flag di compatibilità per i propri
  modelli vendor anche quando arrivano tramite un altro transport compatibile
- `capabilities`: il provider pubblica particolarità di transcript/tooling/famiglia provider
- `normalizeToolSchemas`: il provider pulisce gli schemi degli strumenti prima che il runner
  incorporato li veda
- `inspectToolSchemas`: il provider espone avvisi sugli schemi specifici del transport
  dopo la normalizzazione
- `resolveReasoningOutputMode`: il provider sceglie contratti di output del reasoning
  nativi vs tagged
- `prepareExtraParams`: il provider applica valori predefiniti o normalizza parametri di richiesta per modello
- `createStreamFn`: il provider sostituisce il normale percorso di stream con un
  transport completamente personalizzato
- `wrapStreamFn`: il provider applica wrapper di compatibilità per header/body/modello della richiesta
- `resolveTransportTurnState`: il provider fornisce header o metadati nativi del transport
  per turno
- `resolveWebSocketSessionPolicy`: il provider fornisce header nativi della sessione WebSocket
  o una policy di cooldown della sessione
- `createEmbeddingProvider`: il provider gestisce il comportamento di embedding della memoria quando
  appartiene al plugin provider invece che allo switchboard embedding del core
- `formatApiKey`: il provider formatta i profili auth memorizzati nella stringa `apiKey`
  del runtime attesa dal transport
- `refreshOAuth`: il provider gestisce il refresh OAuth quando i refresher condivisi
  `pi-ai` non sono sufficienti
- `buildAuthDoctorHint`: il provider aggiunge indicazioni di riparazione quando il refresh OAuth
  fallisce
- `matchesContextOverflowError`: il provider riconosce errori di overflow della
  finestra di contesto specifici del provider che le euristiche generiche non rileverebbero
- `classifyFailoverReason`: il provider mappa errori raw specifici del provider dal transport/API
  in motivi di failover come rate limit o overload
- `isCacheTtlEligible`: il provider decide quali ID modello upstream supportano il TTL della prompt cache
- `buildMissingAuthMessage`: il provider sostituisce l'errore generico dell'auth store
  con un suggerimento di recupero specifico del provider
- `suppressBuiltInModel`: il provider nasconde righe upstream obsolete e può restituire un
  errore gestito dal vendor per i fallimenti di risoluzione diretta
- `augmentModelCatalog`: il provider aggiunge righe sintetiche/finali al catalogo dopo
  discovery e merge della configurazione
- `isBinaryThinking`: il provider gestisce UX del thinking binario on/off
- `supportsXHighThinking`: il provider abilita `xhigh` per i modelli selezionati
- `resolveDefaultThinkingLevel`: il provider gestisce la policy predefinita di `/think` per una
  famiglia di modelli
- `applyConfigDefaults`: il provider applica valori predefiniti globali specifici del provider
  durante la materializzazione della configurazione in base a modalità auth, env o famiglia del modello
- `isModernModelRef`: il provider gestisce il matching dei modelli preferiti live/smoke
- `prepareRuntimeAuth`: il provider trasforma una credenziale configurata in un token runtime
  a breve durata
- `resolveUsageAuth`: il provider risolve credenziali di utilizzo/quota per `/usage`
  e relative superfici di stato/reporting
- `fetchUsageSnapshot`: il provider gestisce fetch/parsing dell'endpoint di utilizzo mentre
  il core mantiene shell riepilogativa e formattazione
- `onModelSelected`: il provider esegue effetti collaterali post-selezione come
  telemetria o bookkeeping della sessione gestito dal provider

Esempi inclusi attuali:

- `anthropic`: fallback forward-compat per Claude 4.6, suggerimenti per la riparazione auth, fetch
  dell'endpoint di utilizzo, metadati cache-TTL/famiglia provider e valori predefiniti globali di configurazione
  consapevoli dell'auth
- `amazon-bedrock`: riconoscimento di overflow del contesto gestito dal provider e classificazione del
  motivo di failover per errori Bedrock specifici di throttle/non-ready, oltre alla famiglia condivisa
  `anthropic-by-model` di replay per le guardie di replay-policy solo Claude sul traffico Anthropic
- `anthropic-vertex`: guardie di replay-policy solo Claude sul traffico di messaggi Anthropic
- `openrouter`: ID modello pass-through, wrapper delle richieste, suggerimenti di capacità del provider,
  sanitizzazione della thought-signature Gemini sul traffico Gemini proxato, iniezione del
  reasoning del proxy tramite la famiglia di stream `openrouter-thinking`, inoltro dei metadati di routing
  e policy cache-TTL
- `github-copilot`: onboarding/device login, fallback forward-compat dei modelli,
  suggerimenti transcript Claude-thinking, scambio di token runtime e fetch dell'endpoint
  di utilizzo
- `openai`: fallback forward-compat GPT-5.4, normalizzazione diretta del transport OpenAI,
  suggerimenti di autenticazione mancante compatibili con Codex, soppressione di Spark, righe sintetiche
  di catalogo OpenAI/Codex, policy thinking/live-model, normalizzazione degli alias dei token
  di utilizzo (`input` / `output` e famiglie `prompt` / `completion`), la famiglia di stream condivisa
  `openai-responses-defaults` per wrapper nativi OpenAI/Codex, metadati della famiglia provider,
  registrazione inclusa del provider di generazione immagini per `gpt-image-1` e registrazione inclusa del provider
  di generazione video per `sora-2`
- `google` e `google-gemini-cli`: fallback forward-compat Gemini 3.1,
  validazione replay Gemini nativa, sanitizzazione bootstrap replay, modalità di output
  del reasoning tagged, matching dei modelli moderni, registrazione inclusa del provider di generazione
  immagini per i modelli Gemini image-preview e registrazione inclusa del
  provider di generazione video per i modelli Veo; Gemini CLI OAuth inoltre
  gestisce formattazione dei token del profilo auth, parsing dei token di utilizzo e fetch
  dell'endpoint quota per le superfici di utilizzo
- `moonshot`: transport condiviso, normalizzazione del payload thinking gestita dal plugin
- `kilocode`: transport condiviso, header delle richieste gestiti dal plugin, normalizzazione
  del payload reasoning, sanitizzazione della thought-signature proxy-Gemini e policy cache-TTL
- `zai`: fallback forward-compat GLM-5, valori predefiniti `tool_stream`, policy cache-TTL,
  policy binary-thinking/live-model e autenticazione utilizzo + fetch quota;
  gli ID sconosciuti `glm-5*` vengono sintetizzati dal template incluso `glm-4.7`
- `xai`: normalizzazione nativa del transport Responses, riscritture degli alias `/fast` per
  le varianti veloci di Grok, `tool_stream` predefinito, pulizia specifica xAI di schema strumenti /
  payload reasoning e registrazione inclusa del provider di generazione video
  per `grok-imagine-video`
- `mistral`: metadati di capacità gestiti dal plugin
- `opencode` e `opencode-go`: metadati di capacità gestiti dal plugin più
  sanitizzazione della thought-signature proxy-Gemini
- `alibaba`: catalogo di generazione video gestito dal plugin per riferimenti diretti ai modelli Wan
  come `alibaba/wan2.6-t2v`
- `byteplus`: cataloghi gestiti dal plugin più registrazione inclusa del provider di generazione video
  per i modelli Seedance text-to-video/image-to-video
- `fal`: registrazione inclusa del provider di generazione video per modelli video terzi ospitati
  registrazione del provider di generazione immagini per i modelli immagine FLUX più registrazione inclusa
  del provider di generazione video per modelli video terzi ospitati
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` e `volcengine`:
  solo cataloghi gestiti dal plugin
- `qwen`: cataloghi gestiti dal plugin per modelli di testo più registrazioni condivise
  di provider media-understanding e video-generation per le sue superfici multimodali;
  la generazione video Qwen usa gli endpoint video Standard DashScope con i modelli Wan inclusi
  come `wan2.6-t2v` e `wan2.7-r2v`
- `runway`: registrazione gestita dal plugin del provider di generazione video
  per modelli nativi Runway basati su task come `gen4.5`
- `minimax`: cataloghi gestiti dal plugin, registrazione inclusa del provider di generazione video
  per i modelli video Hailuo, registrazione inclusa del provider di generazione immagini
  per `image-01`, selezione ibrida della replay-policy Anthropic/OpenAI e logica
  di autenticazione/snapshot dell'utilizzo
- `together`: cataloghi gestiti dal plugin più registrazione inclusa del provider di generazione video
  per i modelli video Wan
- `xiaomi`: cataloghi gestiti dal plugin più logica di autenticazione/snapshot dell'utilizzo

Il plugin incluso `openai` ora gestisce entrambi gli ID provider: `openai` e
`openai-codex`.

Questo copre i provider che rientrano ancora nei transport normali di OpenClaw. Un provider
che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione
separata e più profonda.

## Rotazione delle chiavi API

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singola override live, priorità massima)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e rimuove i duplicati.
- Le richieste vengono ritentate con la chiave successiva solo in caso di risposte con rate limit (per
  esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o messaggi periodici di limite di utilizzo).
- I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione della chiave.
- Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Provider integrati (catalogo pi-ai)

OpenClaw include il catalogo pi‑ai. Questi provider non richiedono alcuna
configurazione `models.providers`; basta impostare auth + scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singola override)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up di OpenAI Responses WebSocket è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non
  ai proxy generici compatibili con OpenAI
- I percorsi OpenAI nativi mantengono anche `store` di Responses, suggerimenti della prompt cache e
  modellazione del payload compatibile con il reasoning OpenAI; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché l'API OpenAI live lo rifiuta; Spark è trattato come solo Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singola override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste dirette pubbliche Anthropic supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a `service_tier` Anthropic (`auto` vs `standard_only`)
- Nota Anthropic: lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, salvo nuova policy pubblicata da Anthropic.
- Il setup-token Anthropic resta disponibile come percorso token supportato in OpenClaw, ma ora OpenClaw preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

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
- Anche `params.serviceTier` viene inoltrato nelle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) vengono aggiunti solo al traffico Codex nativo verso
  `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` resta disponibile quando il catalogo OAuth Codex lo espone; dipende dai diritti
- `openai-codex/gpt-5.4` mantiene `contextWindow = 1050000` nativo e un `contextTokens = 272000` runtime predefinito; sovrascrivi il limite runtime con `models.providers.openai-codex.models[].contextTokens`
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

- [Qwen Cloud](/it/providers/qwen): superficie provider Qwen Cloud più mappatura degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/it/providers/minimax): accesso MiniMax Coding Plan con OAuth o chiave API
- [GLM Models](/it/providers/glm): endpoint Z.AI Coding Plan o API generali

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

### Google Gemini (chiave API)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singola override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione OpenClaw legacy che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; i cache hit Gemini emergono come `cacheRead` di OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth
- Attenzione: Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo l'uso di client di terze parti. Rivedi i termini di Google e usa un account non critico se scegli di procedere.
- Gemini CLI OAuth viene distribuito come parte del plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3.1-pro-preview`
  - Nota: **non** devi incollare un client id o un secret in `openclaw.json`. Il flusso di login CLI memorizza
    i token nei profili auth sull'host gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway.
  - Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'utilizzo usa come fallback
    `stats`, con `stats.cached` normalizzato in `cacheRead` di OpenClaw.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati in `zai/*`
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
- Il catalogo fallback statico include `kilocode/kilo/auto`; la discovery live
  di `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il
  catalogo runtime.
- L'instradamento upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway,
  non codificato rigidamente in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri plugin provider inclusi

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Modello di esempio: `openrouter/auto`
- OpenClaw applica gli header di attribuzione app documentati da OpenRouter solo quando
  la richiesta è davvero diretta a `openrouter.ai`
- I marker Anthropic `cache_control` specifici di OpenRouter sono allo stesso modo limitati
  ai percorsi OpenRouter verificati, non a URL proxy arbitrari
- OpenRouter resta sul percorso compatibile con OpenAI in stile proxy, quindi la modellazione
  nativa delle richieste solo OpenAI (`serviceTier`, `store` di Responses,
  suggerimenti della prompt cache, payload compatibili con il reasoning OpenAI) non viene inoltrata
- I riferimenti OpenRouter basati su Gemini mantengono solo la sanitizzazione della thought-signature proxy-Gemini;
  la validazione replay Gemini nativa e le riscritture bootstrap restano disattivate
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Modello di esempio: `kilocode/kilo/auto`
- I riferimenti Kilo basati su Gemini mantengono lo stesso percorso di sanitizzazione della
  thought-signature proxy-Gemini; `kilocode/kilo/auto` e altri suggerimenti
  proxy-reasoning-unsupported saltano l'iniezione del reasoning del proxy
- MiniMax: `minimax` (chiave API) e `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`
- Modello di esempio: `minimax/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7`
- La configurazione onboarding/chiave API di MiniMax scrive definizioni esplicite del modello M2.7 con
  `input: ["text", "image"]`; il catalogo provider incluso mantiene i riferimenti chat
  solo testo finché la configurazione del provider non viene materializzata
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
  - I modelli GLM su Cerebras usano gli ID `zai-glm-4.7` e `zai-glm-4.6`.
  - Base URL compatibile con OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Modello di esempio per Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Vedi [Hugging Face (Inference)](/it/providers/huggingface).

## Provider tramite `models.providers` (personalizzato/base URL)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o
proxy compatibili con OpenAI/Anthropic.

Molti dei plugin provider inclusi qui sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere il
base URL, gli header o la lista di modelli predefiniti.

### Moonshot AI (Kimi)

Moonshot è distribuito come plugin provider incluso. Usa il provider integrato per
impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando
devi sovrascrivere il base URL o i metadati del modello:

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

Il legacy `kimi/k2p5` resta accettato come ID modello di compatibilità.

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
viene registrato allo stesso tempo.

Nei selettori di modelli di onboarding/configurazione, la scelta auth Volcengine preferisce sia le righe
`volcengine/*` sia `volcengine-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore vuoto
limitato al provider.

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
viene registrato allo stesso tempo.

Nei selettori di modelli di onboarding/configurazione, la scelta auth BytePlus preferisce sia le righe
`byteplus/*` sia `byteplus-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore vuoto
limitato al provider.

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
- MiniMax chiave API (globale): `--auth-choice minimax-global-api`
- MiniMax chiave API (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

Sul percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il thinking per
impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capacità gestita dal plugin:

- I valori predefiniti testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, gestita dal plugin, su entrambi i percorsi auth MiniMax
- La ricerca web resta sull'ID provider `minimax`

### Ollama

Ollama è distribuito come plugin provider incluso e usa l'API nativa di Ollama:

- Provider: `ollama`
- Auth: nessuna richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando lo abiliti con
`OLLAMA_API_KEY`, e il plugin provider incluso aggiunge Ollama direttamente a
`openclaw onboard` e al selettore modelli. Vedi [/providers/ollama](/it/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come plugin provider incluso per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Auth: facoltativa (dipende dal tuo server)
- Base URL predefinito: `http://127.0.0.1:8000/v1`

Per abilitare l'auto-discovery in locale (qualsiasi valore va bene se il tuo server non richiede auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang è distribuito come plugin provider incluso per server self-hosted
compatibili con OpenAI ad alte prestazioni:

- Provider: `sglang`
- Auth: facoltativa (dipende dal tuo server)
- Base URL predefinito: `http://127.0.0.1:30000/v1`

Per abilitare l'auto-discovery in locale (qualsiasi valore va bene se il tuo server non
richiede auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Vedi [/providers/sglang](/it/providers/sglang) per i dettagli.

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
  Se omessi, OpenClaw usa i seguenti valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider per ruoli `developer` non supportati.
- I percorsi compatibili con OpenAI in stile proxy saltano anche la modellazione nativa delle richieste solo OpenAI:
  niente `service_tier`, niente `store` di Responses, niente suggerimenti della prompt cache, niente
  modellazione del payload compatibile con il reasoning OpenAI e nessun header nascosto di attribuzione OpenClaw.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
- Per sicurezza, un valore esplicito `compat.supportsDeveloperRole: true` viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [/gateway/configuration](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Models](/it/concepts/models) — configurazione e alias dei modelli
- [Model Failover](/it/concepts/model-failover) — catene di fallback e comportamento dei retry
- [Configuration Reference](/it/gateway/configuration-reference#agent-defaults) — chiavi di configurazione dei modelli
- [Providers](/it/providers) — guide di configurazione per provider
