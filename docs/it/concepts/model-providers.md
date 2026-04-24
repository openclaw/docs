---
read_when:
    - Hai bisogno di un riferimento per la configurazione dei modelli, provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
summary: Panoramica del provider di modelli con configurazioni di esempio + flussi CLI
title: provider di modelli
x-i18n:
    generated_at: "2026-04-24T15:23:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

Questa pagina copre i **provider LLM/modelli** (non i canali chat come WhatsApp/Telegram).
Per le regole di selezione dei modelli, vedi [/concepts/models](/it/concepts/models).

## Regole rapide

- I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- `agents.defaults.models` agisce come allowlist quando è impostato.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` sono metadati nativi del modello; `contextTokens` è il limite effettivo di runtime.
- Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Failover dei modelli](/it/concepts/model-failover).
- I percorsi della famiglia OpenAI sono specifici per prefisso: `openai/<model>` usa il provider diretto con chiave API OpenAI in PI, `openai-codex/<model>` usa OAuth Codex in PI, e `openai/<model>` più `agents.defaults.embeddedHarness.runtime: "codex"` usa l'harness nativo app-server Codex. Vedi [OpenAI](/it/providers/openai) e [Harness Codex](/it/plugins/codex-harness).
- L'abilitazione automatica del Plugin segue lo stesso confine: `openai-codex/<model>` appartiene al Plugin OpenAI, mentre il Plugin Codex viene abilitato da `embeddedHarness.runtime: "codex"` o dai riferimenti legacy `codex/<model>`.
- GPT-5.5 è attualmente disponibile tramite percorsi subscription/OAuth: `openai-codex/gpt-5.5` in PI oppure `openai/gpt-5.5` con l'harness app-server Codex. Il percorso diretto con chiave API per `openai/gpt-5.5` è supportato non appena OpenAI abilita GPT-5.5 sulla API pubblica; fino ad allora usa modelli abilitati API come `openai/gpt-5.4` per le configurazioni `OPENAI_API_KEY`.

## Comportamento del provider gestito dal Plugin

La maggior parte della logica specifica del provider vive nei plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il loop di inferenza generico. I plugin gestiscono onboarding, cataloghi di modelli, mapping delle variabili d'ambiente di autenticazione, normalizzazione di trasporto/configurazione, pulizia dello schema degli strumenti, classificazione del failover, refresh OAuth, report dell'uso, profili di thinking/reasoning e altro.

L'elenco completo degli hook del provider-SDK e degli esempi di plugin inclusi si trova in [Plugin provider](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste completamente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Il `capabilities` di runtime del provider è metadato condiviso del runner (famiglia di provider, particolarità di transcript/tooling, suggerimenti di trasporto/cache). Non è la stessa cosa del [modello di capability pubblico](/it/plugins/architecture#public-capability-model), che descrive cosa registra un Plugin (inferenza di testo, voce, ecc.).
</Note>

## Rotazione delle chiavi API

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, priorità più alta)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, anche `GOOGLE_API_KEY` è incluso come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e rimuove i duplicati.
- Le richieste vengono ritentate con la chiave successiva solo sulle risposte di rate limit (ad esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, o messaggi periodici di limite d'uso).
- Gli errori non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione della chiave.
- Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

## Provider integrati (catalogo pi-ai)

OpenClaw include il catalogo pi‑ai. Questi provider non richiedono alcuna configurazione `models.providers`; basta impostare l'autenticazione e scegliere un modello.

### OpenAI

- Provider: `openai`
- Autenticazione: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singolo override)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Il supporto diretto API per GPT-5.5 è pronto per il futuro qui, non appena OpenAI esporrà GPT-5.5 sulla API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket di OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header di attribuzione OpenClaw nascosti (`originator`, `version`,
  `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- I percorsi OpenAI nativi mantengono anche `store` di Responses, i suggerimenti di prompt-cache e la modellazione del payload compatibile con il reasoning OpenAI; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché le richieste API OpenAI live lo rifiutano e l'attuale catalogo Codex non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Autenticazione: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singolo override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, salvo pubblicazione di una nuova policy da parte di Anthropic.
- Il setup-token Anthropic resta disponibile come percorso token supportato in OpenClaw, ma ora OpenClaw preferisce il riuso di Claude CLI e `claude -p` quando disponibili.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Provider: `openai-codex`
- Autenticazione: OAuth (ChatGPT)
- Riferimento modello PI: `openai-codex/gpt-5.5`
- Riferimento harness app-server Codex nativo: `openai/gpt-5.5` con `agents.defaults.embeddedHarness.runtime: "codex"`
- Riferimenti modello legacy: `codex/gpt-*`
- Confine del Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin app-server Codex nativo viene selezionato solo dal runtime harness Codex o dai riferimenti legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche sulle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header di attribuzione OpenClaw nascosti (`originator`, `version`,
  `User-Agent`) vengono allegati solo al traffico Codex nativo verso
  `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.5` mantiene il valore nativo `contextWindow = 1000000` e un valore predefinito di runtime `contextTokens = 272000`; esegui l'override del limite di runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota sulla policy: OAuth OpenAI Codex è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- L'accesso attuale a GPT-5.5 usa questo percorso OAuth/subscription finché OpenAI non abilita GPT-5.5 sulla API pubblica.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni hosted in stile subscription

- [Qwen Cloud](/it/providers/qwen): superficie provider Qwen Cloud più mapping degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/it/providers/minimax): accesso OAuth o con chiave API a MiniMax Coding Plan
- [GLM Models](/it/providers/glm): endpoint Z.AI Coding Plan o API generali

### OpenCode

- Autenticazione: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
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
- Autenticazione: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singolo override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; i cache hit Gemini vengono esposti come OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Autenticazione: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth
- Attenzione: OAuth Gemini CLI in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo l'uso di client di terze parti. Verifica i termini di Google e usa un account non critico se scegli di procedere.
- OAuth Gemini CLI è distribuito come parte del Plugin `google` incluso.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **non** incolli un client id o secret in `openclaw.json`. Il flusso di login CLI archivia i token nei profili di autenticazione sull'host Gateway.
  - Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host Gateway.
  - Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'uso ricade su `stats`, con `stats.cached` normalizzato in OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Autenticazione: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati in `zai/*`
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Autenticazione: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Autenticazione: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL di base: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; il rilevamento live di `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo di runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway, non codificato rigidamente in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri plugin provider inclusi

| Provider | Id | Variabile env di autenticazione | Modello di esempio |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus | `byteplus` / `byteplus-plan` | `BYTEPLUS_API_KEY` | `byteplus-plan/ark-code-latest` |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` | `cerebras/zai-glm-4.7` |
| Cloudflare AI Gateway | `cloudflare-ai-gateway` | `CLOUDFLARE_AI_GATEWAY_API_KEY` | — |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` | `deepseek/deepseek-v4-flash` |
| GitHub Copilot | `github-copilot` | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | — |
| Groq | `groq` | `GROQ_API_KEY` | — |
| Hugging Face Inference | `huggingface` | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN` | `huggingface/deepseek-ai/DeepSeek-R1` |
| Kilo Gateway | `kilocode` | `KILOCODE_API_KEY` | `kilocode/kilo/auto` |
| Kimi Coding | `kimi` | `KIMI_API_KEY` or `KIMICODE_API_KEY` | `kimi/kimi-code` |
| MiniMax | `minimax` / `minimax-portal` | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN` | `minimax/MiniMax-M2.7` |
| Mistral | `mistral` | `MISTRAL_API_KEY` | `mistral/mistral-large-latest` |
| Moonshot | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.6` |
| NVIDIA | `nvidia` | `NVIDIA_API_KEY` | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/auto` |
| Qianfan | `qianfan` | `QIANFAN_API_KEY` | `qianfan/deepseek-v3.2` |
| Qwen Cloud | `qwen` | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus` |
| StepFun | `stepfun` / `stepfun-plan` | `STEPFUN_API_KEY` | `stepfun/step-3.5-flash` |
| Together | `together` | `TOGETHER_API_KEY` | `together/moonshotai/Kimi-K2.5` |
| Venice | `venice` | `VENICE_API_KEY` | — |
| Vercel AI Gateway | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY` | `volcengine-plan/ark-code-latest` |
| xAI | `xai` | `XAI_API_KEY` | `xai/grok-4` |
| Xiaomi | `xiaomi` | `XIAOMI_API_KEY` | `xiaomi/mimo-v2-flash` |

Particolarità da conoscere:

- **OpenRouter** applica i suoi header di attribuzione dell'app e i marker Anthropic `cache_control` solo sui percorsi `openrouter.ai` verificati. Come percorso in stile proxy compatibile con OpenAI, salta la modellazione riservata a OpenAI nativo (`serviceTier`, `store` di Responses, suggerimenti di prompt-cache, compatibilità reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanificazione della thought signature di Gemini via proxy.
- **Kilo Gateway** per i riferimenti basati su Gemini segue lo stesso percorso di sanificazione Gemini via proxy; `kilocode/kilo/auto` e gli altri riferimenti proxy che non supportano il reasoning saltano l'iniezione del reasoning proxy.
- **MiniMax** l'onboarding con chiave API scrive definizioni esplicite del modello M2.7 con `input: ["text", "image"]`; il catalogo incluso mantiene i riferimenti chat solo testuali finché quella configurazione non viene materializzata.
- **xAI** usa il percorso xAI Responses. `/fast` o `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disattivalo con `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** i modelli GLM usano `zai-glm-4.7` / `zai-glm-4.6`; l'URL base compatibile con OpenAI è `https://api.cerebras.ai/v1`.

## Provider tramite `models.providers` (personalizzato / URL base)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi di seguito pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL base predefinito, gli header o l'elenco dei modelli.

### Moonshot AI (Kimi)

Moonshot è distribuito come Plugin provider incluso. Usa il provider integrato come impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando hai bisogno di sovrascrivere l'URL base o i metadati del modello:

- Provider: `moonshot`
- Autenticazione: `MOONSHOT_API_KEY`
- Modello di esempio: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID modello Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding usa l'endpoint compatibile con Anthropic di Moonshot AI:

- Provider: `kimi`
- Autenticazione: `KIMI_API_KEY`
- Modello di esempio: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Il legacy `kimi/k2p5` continua a essere accettato come ID modello di compatibilità.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornisce accesso a Doubao e ad altri modelli in Cina.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Autenticazione: `VOLCANO_ENGINE_API_KEY`
- Modello di esempio: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma allo stesso tempo viene registrato il catalogo generale `volcengine/*`.

Nei selettori del modello di onboarding/configurazione, la scelta di autenticazione Volcengine privilegia sia le righe `volcengine/*` sia quelle `volcengine-plan/*`. Se questi modelli non sono ancora caricati, OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

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
- Autenticazione: `BYTEPLUS_API_KEY`
- Modello di esempio: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L'onboarding usa per impostazione predefinita la superficie coding, ma allo stesso tempo viene registrato il catalogo generale `byteplus/*`.

Nei selettori del modello di onboarding/configurazione, la scelta di autenticazione BytePlus privilegia sia le righe `byteplus/*` sia quelle `byteplus-plan/*`. Se questi modelli non sono ancora caricati, OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

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
- Autenticazione: `SYNTHETIC_API_KEY`
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

- OAuth MiniMax (globale): `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticazione: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il thinking per impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capability gestita dal Plugin:

- Le impostazioni predefinite di testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, gestita dal plugin, su entrambi i percorsi di autenticazione MiniMax
- La ricerca web resta sull'id provider `minimax`

### LM Studio

LM Studio è distribuito come Plugin provider incluso che usa la API nativa:

- Provider: `lmstudio`
- Autenticazione: `LM_API_TOKEN`
- URL base predefinito per l'inferenza: `http://localhost:1234/v1`

Quindi imposta un modello (sostituisci con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa i percorsi nativi di LM Studio `/api/v1/models` e `/api/v1/models/load` per discovery + auto-load, con `/v1/chat/completions` per l'inferenza per impostazione predefinita.
Vedi [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama è distribuito come Plugin provider incluso e usa la API nativa di Ollama:

- Provider: `ollama`
- Autenticazione: nessuna richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando esegui l'opt-in con `OLLAMA_API_KEY`, e il Plugin provider incluso aggiunge Ollama direttamente a `openclaw onboard` e al selettore dei modelli. Vedi [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come Plugin provider incluso per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per eseguire l'opt-in all'auto-discovery in locale (qualsiasi valore funziona se il tuo server non impone autenticazione):

```bash
export VLLM_API_KEY="vllm-local"
```

Quindi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang è distribuito come Plugin provider incluso per server self-hosted veloci compatibili con OpenAI:

- Provider: `sglang`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per eseguire l'opt-in all'auto-discovery in locale (qualsiasi valore funziona se il tuo server non impone autenticazione):

```bash
export SGLANG_API_KEY="sglang-local"
```

Quindi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

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
        apiKey: "${LM_API_TOKEN}",
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
  Se omessi, OpenClaw usa questi valori predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider dovuti a ruoli `developer` non supportati.
- I percorsi compatibili con OpenAI in stile proxy saltano anche la modellazione delle richieste riservata a OpenAI nativo: niente `service_tier`, niente `store` di Responses, niente suggerimenti di prompt-cache, niente modellazione del payload compatibile con il reasoning OpenAI e nessun header di attribuzione OpenClaw nascosto.
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

- [Models](/it/concepts/models) — configurazione dei modelli e alias
- [Failover dei modelli](/it/concepts/model-failover) — catene di fallback e comportamento dei retry
- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
- [Provider](/it/providers) — guide di configurazione per provider
