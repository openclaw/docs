---
read_when:
    - Ti serve un riferimento di configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-24T08:37:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Questa pagina tratta i **provider LLM/modelli** (non i canali chat come WhatsApp/Telegram).
Per le regole di selezione del modello, vedi [/concepts/models](/it/concepts/models).

## Regole rapide

- I riferimenti dei modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
- `agents.defaults.models` agisce come allowlist quando è impostato.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` è metadato nativo del modello; `contextTokens` è il limite runtime effettivo.
- Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Model failover](/it/concepts/model-failover).
- I percorsi della famiglia OpenAI sono specifici del prefisso: `openai/<model>` usa il provider diretto con API key
  OpenAI in PI, `openai-codex/<model>` usa OAuth Codex in PI,
  e `openai/<model>` più `agents.defaults.embeddedHarness.runtime: "codex"` usa l'harness nativo app-server Codex. Vedi [OpenAI](/it/providers/openai)
  e [Codex harness](/it/plugins/codex-harness).
- L'abilitazione automatica del Plugin segue lo stesso confine: `openai-codex/<model>` appartiene
  al Plugin OpenAI, mentre il Plugin Codex è abilitato da
  `embeddedHarness.runtime: "codex"` o dai riferimenti legacy `codex/<model>`.
- GPT-5.5 è attualmente disponibile tramite percorsi subscription/OAuth:
  `openai-codex/gpt-5.5` in PI oppure `openai/gpt-5.5` con l'harness
  app-server Codex. Il percorso diretto con API key per `openai/gpt-5.5` è supportato quando
  OpenAI abiliterà GPT-5.5 sulla API pubblica; fino ad allora usa modelli
  abilitati per API come `openai/gpt-5.4` per configurazioni `OPENAI_API_KEY`.

## Comportamento del provider gestito dal Plugin

La maggior parte della logica specifica del provider si trova nei Plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il ciclo di inferenza generico. I Plugin gestiscono onboarding, cataloghi dei modelli, mappatura auth env-var, normalizzazione di trasporto/configurazione, pulizia dello schema degli strumenti, classificazione del failover, refresh OAuth, report di utilizzo, profili di thinking/reasoning e altro.

L'elenco completo degli hook SDK provider e degli esempi di Plugin integrati si trova in [Provider plugins](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Le `capabilities` runtime del provider sono metadati condivisi del runner (famiglia del provider, particolarità di trascrizione/tooling, suggerimenti di trasporto/cache). Non sono la stessa cosa del [modello pubblico delle capability](/it/plugins/architecture#public-capability-model), che descrive ciò che un Plugin registra (inferenza testuale, voce, ecc.).
</Note>

## Rotazione delle API key

- Supporta la rotazione generica del provider per provider selezionati.
- Configura più chiavi tramite:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, priorità massima)
  - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punto e virgola)
  - `<PROVIDER>_API_KEY` (chiave primaria)
  - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)
- Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback.
- L'ordine di selezione delle chiavi preserva la priorità e rimuove i duplicati.
- Le richieste vengono ritentate con la chiave successiva solo su risposte di rate limit (ad
  esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` o messaggi periodici di limite d'uso).
- I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
- Quando tutte le chiavi candidate falliscono, l'errore finale viene restituito dall'ultimo tentativo.

## Provider integrati (catalogo pi-ai)

OpenClaw include il catalogo pi‑ai. Questi provider non richiedono alcuna
configurazione `models.providers`; basta impostare l'autenticazione e scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (override singolo)
- Modelli di esempio: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Il supporto diretto API per GPT-5.5 qui è pronto per il futuro una volta che OpenAI esporrà GPT-5.5 sulla API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Sovrascrivi per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket OpenAI Responses è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un livello esplicito invece del toggle condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) si applicano solo sul traffico OpenAI nativo verso `api.openai.com`, non
  su proxy generici compatibili OpenAI
- I percorsi OpenAI nativi mantengono anche `store` di Responses, suggerimenti di prompt-cache e
  modellazione del payload compatibile con il reasoning OpenAI; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché le richieste API OpenAI live lo rifiutano e l'attuale catalogo Codex non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (override singolo)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con API key e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- Nota Anthropic: il personale Anthropic ci ha detto che l'uso stile Claude CLI di OpenClaw è di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy.
- Il setup-token Anthropic resta disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Riferimento modello PI: `openai-codex/gpt-5.5`
- Riferimento harness nativo app-server Codex: `openai/gpt-5.5` con `agents.defaults.embeddedHarness.runtime: "codex"`
- Riferimenti modello legacy: `codex/gpt-*`
- Confine del Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin
  app-server Codex nativo viene selezionato solo dal runtime harness Codex o dai riferimenti
  legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Sovrascrivi per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche sulle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`,
  `User-Agent`) vengono allegati solo sul traffico Codex nativo verso
  `chatgpt.com/backend-api`, non su proxy generici compatibili OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.5` mantiene il valore nativo `contextWindow = 1000000` e un valore predefinito runtime `contextTokens = 272000`; sovrascrivi il limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota sulla policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/flussi di lavoro esterni come OpenClaw.
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

### Altre opzioni ospitate in stile subscription

- [Qwen Cloud](/it/providers/qwen): superficie provider Qwen Cloud più mappatura degli endpoint Alibaba DashScope e Coding Plan
- [MiniMax](/it/providers/minimax): accesso MiniMax Coding Plan tramite OAuth o API key
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

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override singolo)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent`
  (o il legacy `cached_content`) per inoltrare un handle nativo del provider
  `cachedContents/...`; i cache hit Gemini emergono come `cacheRead` OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth
- Attenzione: l'OAuth Gemini CLI in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni sull'account Google dopo aver usato client di terze parti. Rivedi i termini di Google e usa un account non critico se scegli di procedere.
- L'OAuth Gemini CLI è incluso come parte del Plugin `google` integrato.
  - Installa prima Gemini CLI:
    - `brew install gemini-cli`
    - oppure `npm install -g @google/gemini-cli`
  - Abilita: `openclaw plugins enable google`
  - Accesso: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
  - Nota: **non** incolli un client id o un secret in `openclaw.json`. Il flusso di accesso CLI memorizza
    i token nei profili di autenticazione sull'host gateway.
  - Se le richieste falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway.
  - Le risposte JSON Gemini CLI vengono analizzate da `response`; l'utilizzo usa come fallback
    `stats`, con `stats.cached` normalizzato in `cacheRead` OpenClaw.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` e `z-ai/*` vengono normalizzati in `zai/*`
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; il rilevamento live di
  `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo
  runtime.
- L'instradamento upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway,
  non è codificato rigidamente in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider integrati

| Provider                | Id                               | Auth env                                                     | Modello di esempio                              |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Aspetti utili da conoscere:

- **OpenRouter** applica i suoi header di attribuzione dell'app e i marker Anthropic `cache_control` solo sui percorsi `openrouter.ai` verificati. Come percorso compatibile OpenAI in stile proxy, salta la modellazione riservata a OpenAI nativo (`serviceTier`, `store` di Responses, suggerimenti di prompt-cache, compatibilità di reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanitizzazione della thought-signature di Gemini via proxy.
- **Kilo Gateway** per i riferimenti basati su Gemini segue lo stesso percorso di sanitizzazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy senza supporto al reasoning saltano l'iniezione di reasoning proxy.
- **MiniMax** nell'onboarding con API key scrive definizioni esplicite del modello M2.7 con `input: ["text", "image"]`; il catalogo integrato mantiene i riferimenti chat solo testo finché quella configurazione non viene materializzata.
- **xAI** usa il percorso xAI Responses. `/fast` oppure `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disabilitalo con `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** i modelli GLM usano `zai-glm-4.7` / `zai-glm-4.6`; l'URL base compatibile OpenAI è `https://api.cerebras.ai/v1`.

## Provider tramite `models.providers` (personalizzato/base URL)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o
proxy compatibili OpenAI/Anthropic.

Molti dei Plugin provider integrati sotto pubblicano già un catalogo predefinito.
Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere
l'URL base predefinito, gli header o l'elenco dei modelli.

### Moonshot AI (Kimi)

Moonshot è incluso come Plugin provider integrato. Usa il provider integrato per
impostazione predefinita, e aggiungi una voce esplicita `models.providers.moonshot` solo quando
devi sovrascrivere l'URL base o i metadati del modello:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
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

Kimi Coding usa l'endpoint compatibile Anthropic di Moonshot AI:

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

Il riferimento modello di compatibilità legacy `kimi/k2p5` continua a essere accettato.

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

L'onboarding usa come predefinita la superficie coding, ma il catalogo generale `volcengine/*`
viene registrato contemporaneamente.

Nei selettori di modelli di onboarding/configurazione, la scelta auth Volcengine preferisce sia
le righe `volcengine/*` sia `volcengine-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore
vuoto limitato al provider.

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

BytePlus ARK fornisce accesso agli stessi modelli di Volcano Engine per utenti internazionali.

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

L'onboarding usa come predefinita la superficie coding, ma il catalogo generale `byteplus/*`
viene registrato contemporaneamente.

Nei selettori di modelli di onboarding/configurazione, la scelta auth BytePlus preferisce sia
le righe `byteplus/*` sia `byteplus-plan/*`. Se quei modelli non sono ancora caricati,
OpenClaw usa come fallback il catalogo non filtrato invece di mostrare un selettore
vuoto limitato al provider.

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

Synthetic fornisce modelli compatibili Anthropic dietro il provider `synthetic`:

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
- API key MiniMax (globale): `--auth-choice minimax-global-api`
- API key MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` oppure
  `MINIMAX_API_KEY` per `minimax-portal`

Vedi [/providers/minimax](/it/providers/minimax) per dettagli di configurazione, opzioni dei modelli e snippet di configurazione.

Sul percorso di streaming compatibile Anthropic di MiniMax, OpenClaw disabilita il thinking per
impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive
`MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.

Suddivisione delle capability gestita dal Plugin:

- I valori predefiniti per testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione immagini è `minimax/image-01` oppure `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01` gestita dal Plugin su entrambi i percorsi auth MiniMax
- La ricerca web resta sull'id provider `minimax`

### LM Studio

LM Studio è incluso come Plugin provider integrato e usa l'API nativa:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL base predefinito per l'inferenza: `http://localhost:1234/v1`

Poi imposta un modello (sostituisci con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativi di LM Studio per rilevamento + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita.
Vedi [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama è incluso come Plugin provider integrato e usa l'API nativa di Ollama:

- Provider: `ollama`
- Auth: nessuna richiesta (server locale)
- Modello di esempio: `ollama/llama3.3`
- Installazione: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando attivi
`OLLAMA_API_KEY`, e il Plugin provider integrato aggiunge direttamente Ollama a
`openclaw onboard` e al selettore dei modelli. Vedi [/providers/ollama](/it/providers/ollama)
per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è incluso come Plugin provider integrato per server locali/self-hosted
compatibili OpenAI:

- Provider: `vllm`
- Auth: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per attivare il rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non impone l'autenticazione):

```bash
export VLLM_API_KEY="vllm-local"
```

Poi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Vedi [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang è incluso come Plugin provider integrato per server self-hosted
compatibili OpenAI ad alte prestazioni:

- Provider: `sglang`
- Auth: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per attivare il rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non impone
l'autenticazione):

```bash
export SGLANG_API_KEY="sglang-local"
```

Poi imposta un modello (sostituisci con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Vedi [/providers/sglang](/it/providers/sglang) per i dettagli.

### Proxy locali (LM Studio, vLLM, LiteLLM, ecc.)

Esempio (compatibile OpenAI):

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
  Quando omessi, OpenClaw usa come predefiniti:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.
- Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider dovuti a ruoli `developer` non supportati.
- I percorsi compatibili OpenAI in stile proxy saltano anche la
  modellazione delle richieste riservata a OpenAI nativo: niente `service_tier`, niente `store` di Responses, nessun suggerimento di prompt-cache, nessuna
  modellazione del payload compatibile con il reasoning OpenAI e nessun header
  nascosto di attribuzione OpenClaw.
- Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
- Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [/gateway/configuration](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Models](/it/concepts/models) — configurazione dei modelli e alias
- [Model Failover](/it/concepts/model-failover) — catene di fallback e comportamento di nuovo tentativo
- [Configuration Reference](/it/gateway/config-agents#agent-defaults) — chiavi di configurazione del modello
- [Providers](/it/providers) — guide di configurazione per provider
