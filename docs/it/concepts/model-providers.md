---
read_when:
    - Ti serve un riferimento per la configurazione dei modelli, provider per provider
    - Vuoi esempi di config o comandi di onboarding CLI per i provider di modelli
sidebarTitle: Model providers
summary: Panoramica dei provider di modelli con esempi di config + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-04-26T11:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

Riferimento per i **provider LLM/modelli** (non i canali chat come WhatsApp/Telegram). Per le regole di selezione dei modelli, consulta [Models](/it/concepts/models).

## Regole rapide

<AccordionGroup>
  <Accordion title="Model ref e helper CLI">
    - I model ref usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` funge da allowlist quando è impostato.
    - Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow` è metadato nativo del modello; `contextTokens` è il limite effettivo del runtime.
    - Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Model failover](/it/concepts/model-failover).

  </Accordion>
  <Accordion title="Separazione provider/runtime OpenAI">
    I percorsi della famiglia OpenAI sono specifici per prefisso:

    - `openai/<model>` usa il provider diretto OpenAI con chiave API in PI.
    - `openai-codex/<model>` usa OAuth Codex in PI.
    - `openai/<model>` più `agents.defaults.agentRuntime.id: "codex"` usa l’harness nativo dell’app-server Codex.

    Consulta [OpenAI](/it/providers/openai) e [Codex harness](/it/plugins/codex-harness). Se la separazione provider/runtime ti confonde, leggi prima [Agent runtimes](/it/concepts/agent-runtimes).

    L’abilitazione automatica del Plugin segue lo stesso confine: `openai-codex/<model>` appartiene al Plugin OpenAI, mentre il Plugin Codex viene abilitato da `agentRuntime.id: "codex"` o dai model ref legacy `codex/<model>`.

    GPT-5.5 è disponibile tramite `openai/gpt-5.5` per traffico diretto con chiave API, `openai-codex/gpt-5.5` in PI per OAuth Codex e l’harness nativo dell’app-server Codex quando `agentRuntime.id: "codex"` è impostato.

  </Accordion>
  <Accordion title="Runtime CLI">
    I runtime CLI usano la stessa separazione: scegli model ref canonici come `anthropic/claude-*`, `google/gemini-*` o `openai/gpt-*`, quindi imposta `agents.defaults.agentRuntime.id` su `claude-cli`, `google-gemini-cli` o `codex-cli` quando vuoi un backend CLI locale.

    I ref legacy `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` vengono migrati di nuovo a ref canonici del provider con il runtime registrato separatamente.

  </Accordion>
</AccordionGroup>

## Comportamento del provider gestito dal Plugin

La maggior parte della logica specifica del provider vive nei provider Plugin (`registerProvider(...)`), mentre OpenClaw mantiene il loop di inferenza generico. I Plugin gestiscono onboarding, cataloghi modelli, mappatura delle variabili d’ambiente auth, normalizzazione di transport/config, pulizia degli schemi degli strumenti, classificazione del failover, refresh OAuth, reporting dell’utilizzo, profili thinking/reasoning e altro ancora.

L’elenco completo degli hook provider-SDK e gli esempi di Plugin inclusi si trova in [Provider plugins](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste completamente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Le `capabilities` del runtime provider sono metadati condivisi del runner (famiglia provider, particolarità di transcript/tooling, suggerimenti per transport/cache). Non coincidono con il [modello di capability pubblico](/it/plugins/architecture#public-capability-model), che descrive cosa registra un Plugin (inferenza testo, voce, ecc.).
</Note>

## Rotazione delle chiavi API

<AccordionGroup>
  <Accordion title="Origini delle chiavi e priorità">
    Configura più chiavi tramite:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singolo override live, priorità massima)
    - `<PROVIDER>_API_KEYS` (lista separata da virgole o punto e virgola)
    - `<PROVIDER>_API_KEY` (chiave primaria)
    - `<PROVIDER>_API_KEY_*` (lista numerata, ad esempio `<PROVIDER>_API_KEY_1`)

    Per i provider Google, `GOOGLE_API_KEY` è incluso anche come fallback. L’ordine di selezione delle chiavi preserva la priorità e rimuove i duplicati.

  </Accordion>
  <Accordion title="Quando entra in funzione la rotazione">
    - Le richieste vengono ritentate con la chiave successiva solo in risposta a rate limit (ad esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite d’uso).
    - I fallimenti non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
    - Quando tutte le chiavi candidate falliscono, viene restituito l’errore finale dell’ultimo tentativo.

  </Accordion>
</AccordionGroup>

## Provider inclusi (catalogo pi-ai)

OpenClaw include il catalogo pi-ai. Questi provider non richiedono alcuna config `models.providers`; basta impostare l’auth e scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (singolo override)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilità di account/modello con `openclaw models list --provider openai` se una specifica installazione o chiave API si comporta in modo diverso.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up OpenAI Responses WebSocket è abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L’elaborazione con priorità OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste dirette `openai/*` Responses a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`) si applicano solo al traffico nativo OpenAI verso `api.openai.com`, non ai proxy generici compatibili OpenAI
- I percorsi nativi OpenAI mantengono anche `store` di Responses, suggerimenti di prompt cache e formattazione del payload compatibile con OpenAI reasoning; i percorsi proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché le richieste live all’API OpenAI lo rifiutano e l’attuale catalogo Codex non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (singolo override)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste dirette pubbliche Anthropic supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa a Anthropic `service_tier` (`auto` vs `standard_only`)
- La config preferita per Claude CLI mantiene canonico il model ref e seleziona il backend CLI separatamente: `anthropic/claude-opus-4-7` con `agents.defaults.agentRuntime.id: "claude-cli"`. I ref legacy `claude-cli/claude-opus-4-7` funzionano ancora per compatibilità.

<Note>
Lo staff di Anthropic ci ha detto che l’uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l’uso di `claude -p` come approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Il setup-token Anthropic resta disponibile come percorso token supportato da OpenClaw, ma ora OpenClaw preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Model ref PI: `openai-codex/gpt-5.5`
- Ref nativo dell’harness app-server Codex: `openai/gpt-5.5` con `agents.defaults.agentRuntime.id: "codex"`
- Documentazione dell’harness nativo app-server Codex: [Codex harness](/it/plugins/codex-harness)
- Model ref legacy: `codex/gpt-*`
- Confine del Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin nativo dell’app-server Codex viene selezionato solo dal runtime Codex harness o dai ref legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il transport predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- `params.serviceTier` viene inoltrato anche sulle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`) vengono allegati solo al traffico nativo Codex verso `chatgpt.com/backend-api`, non ai proxy generici compatibili OpenAI
- Condivide lo stesso toggle `/fast` e la stessa config `params.fastMode` del diretto `openai/*`; OpenClaw lo mappa a `service_tier=priority`
- `openai-codex/gpt-5.5` usa il catalogo Codex nativo `contextWindow = 400000` e il runtime predefinito `contextTokens = 272000`; fai override del limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- Usa `openai-codex/gpt-5.5` quando vuoi il percorso Codex OAuth/abbonamento; usa `openai/gpt-5.5` quando la tua configurazione con chiave API e il catalogo locale espongono il percorso dell’API pubblica.

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

### Altre opzioni ospitate in stile abbonamento

<CardGroup cols={3}>
  <Card title="Modelli GLM" href="/it/providers/glm">
    Piano Z.AI Coding o endpoint API generali.
  </Card>
  <Card title="MiniMax" href="/it/providers/minimax">
    OAuth MiniMax Coding Plan o accesso con chiave API.
  </Card>
  <Card title="Qwen Cloud" href="/it/providers/qwen">
    Superficie provider Qwen Cloud più mappatura degli endpoint Alibaba DashScope e Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` o `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chiave API)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (singolo override)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la config legacy OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata a `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il dynamic thinking di Google. Gemini 3/3.1 omette un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni dirette Gemini accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del provider `cachedContents/...`; i cache hit Gemini emergono come OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth

<Warning>
L’OAuth di Gemini CLI in OpenClaw è un’integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell’account Google dopo aver usato client di terze parti. Consulta i termini di Google e usa un account non critico se scegli di procedere.
</Warning>

L’OAuth di Gemini CLI è distribuito come parte del Plugin `google` incluso.

<Steps>
  <Step title="Installa Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Abilita il Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Accedi">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`. **Non** inserire un client id o un secret in `openclaw.json`. Il flusso di login della CLI memorizza i token nei profili auth sull’host del gateway.

  </Step>
  <Step title="Imposta il progetto (se necessario)">
    Se le richieste falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull’host del gateway.
  </Step>
</Steps>

Le risposte JSON di Gemini CLI vengono analizzate da `response`; l’utilizzo usa `stats` come fallback, con `stats.cached` normalizzato in OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Gli alias `z.ai/*` e `z-ai/*` vengono normalizzati in `zai/*`
  - `zai-api-key` rileva automaticamente l’endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; il rilevamento live di `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è gestito da Kilo Gateway, non hardcoded in OpenClaw.

Consulta [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri provider Plugin inclusi

| Provider                | Id                               | Variabile auth env                                            | Modello di esempio                             |
| ----------------------- | -------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                            | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                            | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                               | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                            | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`          | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                                | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                          | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                            | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                           | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                     | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                             | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                            | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                              | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                          | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                             | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY`  | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                             | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                            | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                              | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                          | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                      | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                 | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                              | `xiaomi/mimo-v2-flash`                         |

#### Particolarità da conoscere

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applica i suoi header di attribuzione dell’app e i marker Anthropic `cache_control` solo su percorsi `openrouter.ai` verificati. I ref DeepSeek, Moonshot e ZAI sono idonei al TTL cache per la prompt cache gestita da OpenRouter ma non ricevono marker cache Anthropic. Come percorso proxy compatibile OpenAI, salta la formattazione riservata al solo OpenAI nativo (`serviceTier`, `store` di Responses, suggerimenti prompt-cache, compatibilità OpenAI reasoning). I ref supportati da Gemini mantengono solo la sanitizzazione della thought-signature del proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    I ref supportati da Gemini seguono lo stesso percorso di sanitizzazione proxy-Gemini; `kilocode/kilo/auto` e altri ref proxy che non supportano il reasoning saltano l’iniezione proxy reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    L’onboarding con chiave API scrive definizioni esplicite di modelli chat solo testo M2.7; la comprensione delle immagini resta sul provider media `MiniMax-VL-01` gestito dal Plugin.
  </Accordion>
  <Accordion title="xAI">
    Usa il percorso xAI Responses. `/fast` o `params.fastMode: true` riscrivono `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disabilitalo tramite `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    I modelli GLM usano `zai-glm-4.7` / `zai-glm-4.6`; l’URL base compatibile OpenAI è `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provider tramite `models.providers` (personalizzati/base URL)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o proxy compatibili OpenAI/Anthropic.

Molti dei provider Plugin inclusi qui sotto pubblicano già un catalogo predefinito. Usa voci esplicite `models.providers.<id>` solo quando vuoi fare override dell’URL base, degli header o della lista modelli predefiniti.

### Moonshot AI (Kimi)

Moonshot è distribuito come provider Plugin incluso. Usa il provider integrato per impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando hai bisogno di fare override dell’URL base o dei metadati del modello:

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

Kimi Coding usa l’endpoint compatibile Anthropic di Moonshot AI:

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

L’onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `volcengine/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta auth Volcengine preferisce sia le righe `volcengine/*` sia quelle `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto limitato al provider.

<Tabs>
  <Tab title="Modelli standard">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modelli coding (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

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

L’onboarding usa per impostazione predefinita la superficie coding, ma il catalogo generale `byteplus/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta auth BytePlus preferisce sia le righe `byteplus/*` sia quelle `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto limitato al provider.

<Tabs>
  <Tab title="Modelli standard">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelli coding (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

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

MiniMax è configurato tramite `models.providers` perché usa endpoint personalizzati:

- MiniMax OAuth (globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`

Consulta [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di config.

<Note>
Nel percorso di streaming compatibile Anthropic di MiniMax, OpenClaw disabilita il thinking per impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
</Note>

Suddivisione delle capability gestita dal Plugin:

- I valori predefiniti testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01` gestita dal Plugin su entrambi i percorsi auth MiniMax
- La ricerca web resta sull’id provider `minimax`

### LM Studio

LM Studio è distribuito come provider Plugin incluso che usa l’API nativa:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL base predefinito per inferenza: `http://localhost:1234/v1`

Quindi imposta un modello (sostituiscilo con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativi di LM Studio per rilevamento + caricamento automatico, con `/v1/chat/completions` per l’inferenza per impostazione predefinita. Consulta [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama è distribuito come provider Plugin incluso e usa l’API nativa di Ollama:

- Provider: `ollama`
- Auth: non richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando esegui l’opt-in con `OLLAMA_API_KEY`, e il provider Plugin incluso aggiunge Ollama direttamente a `openclaw onboard` e al selettore dei modelli. Consulta [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come provider Plugin incluso per server locali/self-hosted compatibili OpenAI:

- Provider: `vllm`
- Auth: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per eseguire l’opt-in al rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non impone auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Quindi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Consulta [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang è distribuito come provider Plugin incluso per server self-hosted veloci compatibili OpenAI:

- Provider: `sglang`
- Auth: facoltativa (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per eseguire l’opt-in al rilevamento automatico in locale (qualsiasi valore va bene se il tuo server non impone auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Quindi imposta un modello (sostituiscilo con uno degli ID restituiti da `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Consulta [/providers/sglang](/it/providers/sglang) per i dettagli.

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

<AccordionGroup>
  <Accordion title="Campi facoltativi predefiniti">
    Per i provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono facoltativi. Quando omessi, OpenClaw usa questi valori predefiniti:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.

  </Accordion>
  <Accordion title="Regole di formattazione del percorso proxy">
    - Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider per ruoli `developer` non supportati.
    - I percorsi proxy in stile compatibile OpenAI saltano anche la formattazione delle richieste riservata al solo OpenAI nativo: niente `service_tier`, niente `store` di Responses, niente `store` di Completions, niente suggerimenti prompt-cache, niente formattazione del payload compatibile con OpenAI reasoning e nessun header nascosto di attribuzione OpenClaw.
    - Per i proxy Completions compatibili OpenAI che richiedono campi specifici del vendor, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per fondere JSON extra nel corpo della richiesta in uscita.
    - Per i controlli chat-template di vLLM, imposta `agents.defaults.models["provider/model"].params.chat_template_kwargs`. OpenClaw invia automaticamente `enable_thinking: false` e `force_nonempty_content: true` per `vllm/nemotron-3-*` quando il livello di thinking della sessione è disattivato.
    - Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento predefinito OpenAI (che risolve in `api.openai.com`).
    - Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto su endpoint `openai-completions` non nativi.

  </Accordion>
</AccordionGroup>

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Consulta anche: [Configuration](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Riferimento della configurazione](/it/gateway/config-agents#agent-defaults) — chiavi di config del modello
- [Model failover](/it/concepts/model-failover) — catene di fallback e comportamento dei retry
- [Models](/it/concepts/models) — configurazione dei modelli e alias
- [Providers](/it/providers) — guide di configurazione per provider
