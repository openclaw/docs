---
read_when:
    - È necessario un riferimento per la configurazione dei modelli per ciascun fornitore
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
sidebarTitle: Model providers
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Fornitori di modelli
x-i18n:
    generated_at: "2026-05-06T17:54:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

Riferimento per **provider LLM/modelli** (non canali di chat come WhatsApp/Telegram). Per le regole di selezione dei modelli, consulta [Modelli](/it/concepts/models).

## Regole rapide

<AccordionGroup>
  <Accordion title="Riferimenti ai modelli e helper CLI">
    - I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` agisce come allowlist quando è impostato.
    - Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` impostano i valori predefiniti a livello di provider; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` li sovrascrivono per modello.
    - Regole di fallback, probe di cooldown e persistenza delle sostituzioni di sessione: [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>
  <Accordion title="Aggiungere l'autenticazione del provider non modifica il modello principale">
    `openclaw configure` preserva un `agents.defaults.model.primary` esistente quando aggiungi o riautentichi un provider. I Plugin del provider possono comunque restituire un modello predefinito consigliato nella loro patch di configurazione dell'autenticazione, ma configure lo tratta come "rendi disponibile questo modello" quando esiste gia un modello principale, non come "sostituisci il modello principale corrente".

    Per cambiare intenzionalmente il modello predefinito, usa `openclaw models set <provider/model>` oppure `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separazione provider/runtime OpenAI">
    Le route della famiglia OpenAI sono specifiche per prefisso:

    - `openai/<model>` piu `agents.defaults.agentRuntime.id: "codex"` usa l'harness app-server Codex nativo. Questa e la configurazione consueta per l'abbonamento ChatGPT/Codex.
    - `openai-codex/<model>` usa Codex OAuth in PI.
    - `openai/<model>` senza una sostituzione del runtime Codex usa il provider con chiave API OpenAI diretto in PI.

    Consulta [OpenAI](/it/providers/openai) e [Harness Codex](/it/plugins/codex-harness). Se la separazione provider/runtime e poco chiara, leggi prima [Runtime degli agenti](/it/concepts/agent-runtimes).

    L'abilitazione automatica dei Plugin segue lo stesso confine: `openai-codex/<model>` appartiene al Plugin OpenAI, mentre il Plugin Codex viene abilitato da `agentRuntime.id: "codex"` o dai riferimenti legacy `codex/<model>`.

    GPT-5.5 e disponibile tramite l'harness app-server Codex nativo quando `agentRuntime.id: "codex"` e impostato, tramite `openai-codex/gpt-5.5` in PI per Codex OAuth e tramite `openai/gpt-5.5` in PI per il traffico diretto con chiave API quando il tuo account lo espone.

  </Accordion>
  <Accordion title="Runtime CLI">
    I runtime CLI usano la stessa separazione: scegli riferimenti canonici ai modelli come `anthropic/claude-*`, `google/gemini-*` o `openai/gpt-*`, quindi imposta `agents.defaults.agentRuntime.id` su `claude-cli`, `google-gemini-cli` o `codex-cli` quando vuoi un backend CLI locale.

    I riferimenti legacy `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` migrano di nuovo ai riferimenti canonici del provider con il runtime registrato separatamente.

  </Accordion>
</AccordionGroup>

## Comportamento dei provider di proprieta del Plugin

La maggior parte della logica specifica del provider risiede nei Plugin del provider (`registerProvider(...)`), mentre OpenClaw mantiene il ciclo di inferenza generico. I Plugin possiedono onboarding, cataloghi dei modelli, mappatura delle variabili d'ambiente di autenticazione, normalizzazione di trasporto/configurazione, pulizia degli schemi degli strumenti, classificazione del failover, refresh OAuth, reporting dell'utilizzo, profili di thinking/reasoning e altro ancora.

L'elenco completo degli hook SDK dei provider e degli esempi di Plugin in bundle si trova in [Plugin dei provider](/it/plugins/sdk-provider-plugins). Un provider che necessita di un executor di richiesta completamente personalizzato e una superficie di estensione separata e piu profonda.

<Note>
Il comportamento del runner di proprieta del provider vive su hook espliciti del provider, come policy di replay, normalizzazione degli schemi degli strumenti, wrapping dello stream e helper di trasporto/richiesta. La vecchia bag statica `ProviderPlugin.capabilities` esiste solo per compatibilita e non viene piu letta dalla logica condivisa del runner.
</Note>

## Rotazione delle chiavi API

<AccordionGroup>
  <Accordion title="Fonti delle chiavi e priorita">
    Configura piu chiavi tramite:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (singola sostituzione live, massima priorita)
    - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punti e virgola)
    - `<PROVIDER>_API_KEY` (chiave principale)
    - `<PROVIDER>_API_KEY_*` (elenco numerato, ad es. `<PROVIDER>_API_KEY_1`)

    Per i provider Google, anche `GOOGLE_API_KEY` e incluso come fallback. L'ordine di selezione delle chiavi preserva la priorita e rimuove i duplicati.

  </Accordion>
  <Accordion title="Quando entra in azione la rotazione">
    - Le richieste vengono ritentate con la chiave successiva solo su risposte di rate limit (per esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite di utilizzo).
    - Gli errori non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
    - Quando tutte le chiavi candidate falliscono, l'errore finale viene restituito dall'ultimo tentativo.

  </Accordion>
</AccordionGroup>

## Provider integrati (catalogo pi-ai)

OpenClaw include il catalogo pi-ai. Questi provider non richiedono **nessuna** configurazione `models.providers`; imposta solo l'autenticazione e scegli un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, piu `OPENCLAW_LIVE_OPENAI_KEY` (singola sostituzione)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilita dell'account/modello con `openclaw models list --provider openai` se una specifica installazione o chiave API si comporta in modo diverso.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito e `auto` (prima WebSocket, fallback SSE)
- Sostituisci per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Il warm-up WebSocket di OpenAI Responses e abilitato per impostazione predefinita tramite `params.openaiWsWarmup` (`true`/`false`)
- L'elaborazione prioritaria OpenAI puo essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste Responses dirette `openai/*` a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Le intestazioni di attribuzione OpenClaw nascoste (`originator`, `version`, `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche Responses `store`, suggerimenti per la prompt-cache e shaping del payload compatibile con il reasoning OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` e intenzionalmente soppresso in OpenClaw perche le richieste API OpenAI live lo rifiutano e il catalogo Codex corrente non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, piu `OPENCLAW_LIVE_ANTHROPIC_KEY` (singola sostituzione)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa su `service_tier` Anthropic (`auto` rispetto a `standard_only`)
- La configurazione Claude CLI preferita mantiene canonico il riferimento al modello e seleziona separatamente il backend CLI: `anthropic/claude-opus-4-7` con `agents.defaults.agentRuntime.id: "claude-cli"`. I riferimenti legacy `claude-cli/claude-opus-4-7` continuano a funzionare per compatibilita.

<Note>
Lo staff Anthropic ci ha comunicato che l'uso di Claude CLI in stile OpenClaw e di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione, a meno che Anthropic pubblichi una nuova policy. Il setup-token Anthropic resta disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Riferimento modello PI: `openai-codex/gpt-5.5`
- Riferimento harness app-server Codex nativo: `openai/gpt-5.5` con `agents.defaults.agentRuntime.id: "codex"`
- Documentazione dell'harness app-server Codex nativo: [Harness Codex](/it/plugins/codex-harness)
- Riferimenti modello legacy: `codex/gpt-*`
- Confine del Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin app-server Codex nativo viene selezionato solo dal runtime dell'harness Codex o dai riferimenti legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` oppure `openclaw models auth login --provider openai-codex`
- Il trasporto predefinito e `auto` (prima WebSocket, fallback SSE)
- Sostituisci per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Anche `params.serviceTier` viene inoltrato sulle richieste native Codex Responses (`chatgpt.com/backend-api`)
- Le intestazioni di attribuzione OpenClaw nascoste (`originator`, `version`, `User-Agent`) vengono allegate solo al traffico Codex nativo verso `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide la stessa configurazione del toggle `/fast` e di `params.fastMode` delle route dirette `openai/*`; OpenClaw la mappa su `service_tier=priority`
- `openai-codex/gpt-5.5` usa il `contextWindow = 400000` nativo del catalogo Codex e il runtime predefinito `contextTokens = 272000`; sostituisci il limite del runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota sulla policy: OpenAI Codex OAuth e esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- Per la route comune con abbonamento piu runtime Codex nativo, accedi con l'autenticazione `openai-codex` ma configura `openai/gpt-5.5` piu `agents.defaults.agentRuntime.id: "codex"`.
- Usa `openai-codex/gpt-5.5` solo quando vuoi la route Codex OAuth/abbonamento tramite PI; usa `openai/gpt-5.5` senza la sostituzione del runtime Codex quando la tua configurazione con chiave API e il catalogo locale espongono la route API pubblica.
- I riferimenti precedenti `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` e `openai-codex/gpt-5.3*` sono soppressi perche gli account ChatGPT/Codex OAuth li rifiutano; usa invece `openai-codex/gpt-5.5` o la route del runtime Codex nativo.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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
    Z.AI Coding Plan o endpoint API generali.
  </Card>
  <Card title="MiniMax" href="/it/providers/minimax">
    OAuth MiniMax Coding Plan o accesso con chiave API.
  </Card>
  <Card title="Qwen Cloud" href="/it/providers/qwen">
    Superficie del provider Qwen Cloud piu mappatura degli endpoint Alibaba DashScope e Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (chiave API)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotazione facoltativa: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override singolo)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione legacy di OpenClaw che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` è accettato e normalizzato nell'id API Gemini live di Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il thinking dinamico di Google. Gemini 3/3.1 omette un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del provider `cachedContents/...`; gli hit della cache Gemini emergono come `cacheRead` di OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth

<Warning>
Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo l'uso di client di terze parti. Rivedi i termini di Google e usa un account non critico se scegli di procedere.
</Warning>

Gemini CLI OAuth viene fornito come parte del Plugin `google` incluso in bundle.

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
  <Step title="Abilita Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Accesso">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`. **Non** incolli un id client o un segreto in `openclaw.json`. Il flusso di accesso della CLI archivia i token nei profili di autenticazione sull'host del Gateway.

  </Step>
  <Step title="Imposta il progetto (se necessario)">
    Se le richieste falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway.
  </Step>
</Steps>

Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'utilizzo ripiega su `stats`, con `stats.cached` normalizzato in `cacheRead` di OpenClaw.

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
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL base: `https://api.kilo.ai/api/gateway/`
- Il catalogo statico di fallback include `kilocode/kilo/auto`; il rilevamento live di `https://api.kilo.ai/api/gateway/models` può ampliare ulteriormente il catalogo runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway, non codificato rigidamente in OpenClaw.

Vedi [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider inclusi in bundle

| Provider                | Id                               | Env auth                                                     | Modello di esempio                            |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Particolarità da conoscere

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applica le intestazioni di attribuzione dell'app e i marcatori Anthropic `cache_control` solo sulle route `openrouter.ai` verificate. I riferimenti DeepSeek, Moonshot e ZAI sono idonei al TTL della cache per la memorizzazione nella cache dei prompt gestita da OpenRouter, ma non ricevono i marcatori di cache Anthropic. Come percorso in stile proxy compatibile con OpenAI, salta la modellazione valida solo per OpenAI nativo (`serviceTier`, Responses `store`, suggerimenti per la cache dei prompt, compatibilità con il reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanificazione della firma di pensiero proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    I riferimenti basati su Gemini seguono lo stesso percorso di sanificazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy che non supportano il reasoning saltano l'iniezione del reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L'onboarding con chiave API scrive definizioni esplicite solo testo del modello chat M2.7; la comprensione delle immagini resta sul provider multimediale `MiniMax-VL-01` di proprietà del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Gli ID dei modelli usano uno spazio dei nomi `nvidia/<vendor>/<model>` (ad esempio `nvidia/nvidia/nemotron-...` insieme a `nvidia/moonshotai/kimi-k2.5`); i selettori preservano la composizione letterale `<provider>/<model-id>` mentre la chiave canonica inviata all'API resta con un singolo prefisso.
  </Accordion>
  <Accordion title="xAI">
    Usa il percorso xAI Responses. `grok-4.3` è il modello chat predefinito incluso. `/fast` o `params.fastMode: true` riscrive `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è abilitato per impostazione predefinita; disabilitalo tramite `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Viene distribuito come plugin provider `cerebras` incluso. GLM usa `zai-glm-4.7`; l'URL di base compatibile con OpenAI è `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Provider tramite `models.providers` (URL personalizzato/di base)

Usa `models.providers` (o `models.json`) per aggiungere provider **personalizzati** o proxy compatibili con OpenAI/Anthropic.

Molti dei plugin provider inclusi qui sotto pubblicano già un catalogo predefinito. Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL di base predefinito, le intestazioni o l'elenco dei modelli.

I controlli delle capacità dei modelli del Gateway leggono anche i metadati espliciti `models.providers.<id>.models[]`. Se un modello personalizzato o proxy accetta immagini, imposta `input: ["text", "image"]` su quel modello, così WebChat e i percorsi degli allegati originati dal nodo passano le immagini come input nativi del modello invece che come riferimenti multimediali solo testo.

### Moonshot AI (Kimi)

Moonshot viene distribuito come plugin provider incluso. Usa il provider integrato per impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando devi sovrascrivere l'URL di base o i metadati del modello:

- Provider: `moonshot`
- Autenticazione: `MOONSHOT_API_KEY`
- Modello di esempio: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID dei modelli Kimi K2:

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

### Kimi coding

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

`kimi/k2p5` legacy rimane accettato come id modello di compatibilità.

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

L'onboarding usa per impostazione predefinita la superficie di coding, ma il catalogo generale `volcengine/*` viene registrato contemporaneamente.

Nei selettori di modello di onboarding/configurazione, la scelta di autenticazione Volcengine preferisce sia le righe `volcengine/*` sia `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

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

L'onboarding usa per impostazione predefinita la superficie di coding, ma il catalogo generale `byteplus/*` viene registrato contemporaneamente.

Nei selettori di modello di onboarding/configurazione, la scelta di autenticazione BytePlus preferisce sia le righe `byteplus/*` sia `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore limitato al provider vuoto.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

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

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (Global): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`

Consulta [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

<Note>
Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disattiva il thinking per impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
</Note>

Suddivisione delle capacità di proprietà del plugin:

- I valori predefiniti di testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, di proprietà del plugin, su entrambi i percorsi di autenticazione MiniMax
- La ricerca web resta sull'id provider `minimax`

### LM Studio

LM Studio viene fornito come Plugin provider incluso che usa l'API nativa:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- URL di base predefinito per l'inferenza: `http://localhost:1234/v1`

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativi di LM Studio per discovery + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita. Se vuoi che il caricamento JIT, TTL e l'espulsione automatica di LM Studio gestiscano il ciclo di vita del modello, imposta `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama viene fornito come Plugin provider incluso e usa l'API nativa di Ollama:

- Provider: `ollama`
- Auth: non richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando acconsenti esplicitamente con `OLLAMA_API_KEY`, e il Plugin provider incluso aggiunge Ollama direttamente a `openclaw onboard` e al selettore di modelli. Consulta [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM viene fornito come Plugin provider incluso per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Auth: opzionale (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:8000/v1`

Per acconsentire esplicitamente alla discovery automatica locale (qualsiasi valore funziona se il tuo server non applica l'autenticazione):

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

Consulta [/providers/vllm](/it/providers/vllm) per i dettagli.

### SGLang

SGLang viene fornito come Plugin provider incluso per server compatibili con OpenAI veloci e self-hosted:

- Provider: `sglang`
- Auth: opzionale (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:30000/v1`

Per acconsentire esplicitamente alla discovery automatica locale (qualsiasi valore funziona se il tuo server non applica l'autenticazione):

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

Consulta [/providers/sglang](/it/providers/sglang) per i dettagli.

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
        timeoutSeconds: 300,
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
  <Accordion title="Default optional fields">
    Per i provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono opzionali. Quando omessi, OpenClaw usa per impostazione predefinita:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori provider 400 per ruoli `developer` non supportati.
    - Anche le route compatibili con OpenAI in stile proxy saltano la modellazione delle richieste riservata all'OpenAI nativo: nessun `service_tier`, nessun `store` Responses, nessun `store` Completions, nessun suggerimento di prompt-cache, nessuna modellazione del payload di compatibilità del reasoning OpenAI e nessuna intestazione di attribuzione OpenClaw nascosta.
    - Per i proxy Completions compatibili con OpenAI che richiedono campi specifici del vendor, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per unire JSON aggiuntivo nel corpo della richiesta in uscita.
    - Per i controlli chat-template vLLM, imposta `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Il Plugin vLLM incluso invia automaticamente `enable_thinking: false` e `force_nonempty_content: true` per `vllm/nemotron-3-*` quando il livello di thinking della sessione è disattivato.
    - Per modelli locali lenti o host LAN/tailnet remoti, imposta `models.providers.<id>.timeoutSeconds`. Questo estende la gestione delle richieste HTTP del modello del provider, inclusi connessione, intestazioni, streaming del corpo e l'interruzione totale guarded-fetch, senza aumentare il timeout dell'intero runtime dell'agente.
    - Le chiamate HTTP del provider di modelli consentono risposte DNS fake-IP di Surge, Clash e sing-box in `198.18.0.0/15` e `fc00::/7` solo per il nome host `baseUrl` del provider configurato. Altre destinazioni private, loopback, link-local e metadata richiedono comunque un opt-in esplicito `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento predefinito di OpenAI (che risolve in `api.openai.com`).
    - Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.
    - Per `api: "anthropic-messages"` su endpoint non diretti (qualsiasi provider diverso dal `anthropic` canonico, oppure un `models.providers.anthropic.baseUrl` personalizzato il cui host non sia un endpoint pubblico `api.anthropic.com`), OpenClaw sopprime le intestazioni beta Anthropic implicite come `claude-code-20250219`, `interleaved-thinking-2025-05-14` e i marker OAuth, così i proxy personalizzati compatibili con Anthropic non rifiutano flag beta non supportati. Imposta esplicitamente `models.providers.<id>.headers["anthropic-beta"]` se il tuo proxy richiede funzionalità beta specifiche.

  </Accordion>
</AccordionGroup>

## Esempi CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Vedi anche: [Configurazione](/it/gateway/configuration) per esempi completi di configurazione.

## Correlati

- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) - chiavi di configurazione dei modelli
- [Failover dei modelli](/it/concepts/model-failover) - catene di fallback e comportamento dei tentativi
- [Modelli](/it/concepts/models) - configurazione e alias dei modelli
- [Provider](/it/providers) - guide alla configurazione per provider
