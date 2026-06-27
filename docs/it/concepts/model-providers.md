---
read_when:
    - Hai bisogno di un riferimento per la configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i provider di modelli
sidebarTitle: Model providers
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-06-27T17:26:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Riferimento per **provider LLM/modelli** (non canali di chat come WhatsApp/Telegram). Per le regole di selezione dei modelli, vedi [Modelli](/it/concepts/models).

## Regole rapide

<AccordionGroup>
  <Accordion title="Riferimenti dei modelli e helper CLI">
    - I riferimenti dei modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` agisce come allowlist quando è impostato.
    - Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` impostano i valori predefiniti a livello di provider; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` li sovrascrivono per modello.
    - Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>
  <Accordion title="Aggiungere l'autenticazione del provider non modifica il modello primario">
    `openclaw configure` conserva un `agents.defaults.model.primary` esistente quando aggiungi o riautentichi un provider. `openclaw models auth login` fa lo stesso, a meno che tu non passi `--set-default`. I plugin provider possono comunque restituire un modello predefinito consigliato nella loro patch di configurazione dell'autenticazione, ma OpenClaw lo tratta come "rendi disponibile questo modello" quando esiste già un modello primario, non come "sostituisci il modello primario corrente".

    Per cambiare intenzionalmente il modello predefinito, usa `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separazione provider/runtime OpenAI">
    Le route della famiglia OpenAI sono specifiche per prefisso:

    - `openai/<model>` usa per impostazione predefinita l'harness nativo app-server Codex per i turni degli agenti. Questa è la normale configurazione con abbonamento ChatGPT/Codex.
    - i riferimenti legacy dei modelli Codex sono configurazione legacy che doctor riscrive in `openai/<model>`.
    - `openai/<model>` più provider/modello `agentRuntime.id: "openclaw"` usa il runtime integrato di OpenClaw per route esplicite con chiave API o di compatibilità.

    Vedi [OpenAI](/it/providers/openai) e [harness Codex](/it/plugins/codex-harness). Se la separazione provider/runtime crea confusione, leggi prima [Runtime degli agenti](/it/concepts/agent-runtimes).

    L'abilitazione automatica dei Plugin segue lo stesso confine: i riferimenti agente `openai/*` abilitano il Plugin Codex per la route predefinita, e anche provider/modello espliciti `agentRuntime.id: "codex"` o riferimenti legacy `codex/<model>` lo richiedono.

    GPT-5.5 è disponibile tramite l'harness nativo app-server Codex per impostazione predefinita su `openai/gpt-5.5`, e tramite il runtime OpenClaw quando la policy runtime provider/modello seleziona esplicitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtime CLI">
    I runtime CLI usano la stessa separazione: scegli riferimenti di modello canonici come `anthropic/claude-*` o `google/gemini-*`, poi imposta la policy runtime provider/modello su `claude-cli` o `google-gemini-cli` quando vuoi un backend CLI locale.

    I riferimenti legacy `claude-cli/*` e `google-gemini-cli/*` migrano di nuovo a riferimenti provider canonici con il runtime registrato separatamente. I riferimenti legacy `codex-cli/*` migrano a `openai/*` e usano la route app-server Codex; OpenClaw non mantiene più un backend CLI Codex in bundle.

  </Accordion>
</AccordionGroup>

## Comportamento del provider di proprietà del Plugin

La maggior parte della logica specifica del provider vive nei Plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il loop di inferenza generico. I Plugin possiedono onboarding, cataloghi dei modelli, mapping delle variabili d'ambiente di autenticazione, normalizzazione di trasporto/configurazione, pulizia degli schemi degli strumenti, classificazione del failover, refresh OAuth, reporting dell'utilizzo, profili di thinking/reasoning e altro.

L'elenco completo degli hook provider-SDK e degli esempi di Plugin in bundle si trova in [Plugin provider](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste completamente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Il comportamento runner di proprietà del provider vive su hook provider espliciti come policy di replay, normalizzazione degli schemi degli strumenti, wrapping dello stream e helper di trasporto/richiesta. Il bag statico legacy `ProviderPlugin.capabilities` è solo di compatibilità e non viene più letto dalla logica runner condivisa.
</Note>

## Rotazione delle chiavi API

<AccordionGroup>
  <Accordion title="Origini e priorità delle chiavi">
    Configura più chiavi tramite:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live singolo, priorità massima)
    - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punti e virgola)
    - `<PROVIDER>_API_KEY` (chiave primaria)
    - `<PROVIDER>_API_KEY_*` (elenco numerato, es. `<PROVIDER>_API_KEY_1`)

    Per i provider Google, anche `GOOGLE_API_KEY` è incluso come fallback. L'ordine di selezione delle chiavi conserva la priorità e deduplica i valori.

  </Accordion>
  <Accordion title="Quando entra in gioco la rotazione">
    - Le richieste vengono ritentate con la chiave successiva solo su risposte di rate limit (per esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite di utilizzo).
    - Gli errori non legati al rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
    - Quando tutte le chiavi candidate falliscono, l'errore finale viene restituito dall'ultimo tentativo.

  </Accordion>
</AccordionGroup>

## Plugin provider ufficiali

I Plugin provider ufficiali pubblicano le proprie righe di catalogo dei modelli. Questi provider **non** richiedono voci modello in `models.providers`; abilita il Plugin provider, imposta l'autenticazione e scegli un modello. Usa `models.providers` solo per provider personalizzati espliciti o impostazioni di richiesta ristrette, come i timeout.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione facoltativa: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (override singolo)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilità di account/modello con `openclaw models list --provider openai` se un'installazione specifica o una chiave API si comporta diversamente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito è `auto`; OpenClaw passa la scelta del trasporto al runtime modello condiviso.
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- L'elaborazione prioritaria OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste Responses dirette `openai/*` a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header di attribuzione OpenClaw nascosti (`originator`, `version`, `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche `store` di Responses, suggerimenti per la prompt-cache e shaping del payload compatibile con reasoning OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` è disponibile tramite autenticazione OAuth con abbonamento ChatGPT/Codex quando il tuo account connesso lo espone; OpenClaw continua a sopprimere le route con chiave API OpenAI diretta e chiave API Azure per questo modello perché quei trasporti lo rifiutano

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione facoltativa: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (override singolo)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste pubbliche dirette Anthropic supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa su Anthropic `service_tier` (`auto` vs `standard_only`)
- La configurazione Claude CLI preferita mantiene canonico il riferimento del modello e seleziona il backend CLI
  separatamente: `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` con ambito modello. I riferimenti legacy
  `claude-cli/claude-opus-4-7` continuano a funzionare per compatibilità.

<Note>
Lo staff Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Anthropic setup-token rimane disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Provider: `openai`
- Auth: OAuth (ChatGPT)
- Riferimento modello legacy OpenAI Codex: `openai/gpt-5.5`
- Riferimento harness nativo app-server Codex: `openai/gpt-5.5`
- Documentazione dell'harness nativo app-server Codex: [harness Codex](/it/plugins/codex-harness)
- Riferimenti modello legacy: `codex/gpt-*`
- Confine Plugin: `openai/*` carica il Plugin OpenAI; il Plugin nativo app-server Codex viene selezionato dal runtime dell'harness Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello OpenAI Codex tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Anche `params.serviceTier` viene inoltrato sulle richieste Responses Codex native (`chatgpt.com/backend-api`)
- Gli header di attribuzione OpenClaw nascosti (`originator`, `version`, `User-Agent`) vengono allegati solo al traffico Codex nativo verso `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide la stessa configurazione del toggle `/fast` e `params.fastMode` di `openai/*` diretto; OpenClaw la mappa su `service_tier=priority`
- `openai/gpt-5.5` usa il `contextWindow = 400000` nativo del catalogo Codex e il runtime predefinito `contextTokens = 272000`; sovrascrivi il limite runtime con `models.providers.openai.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è supportato esplicitamente per strumenti/workflow esterni come OpenClaw.
- Per la route comune con abbonamento più runtime Codex nativo, accedi con autenticazione `openai` e configura `openai/gpt-5.5`; i turni agente OpenAI selezionano Codex per impostazione predefinita.
- Usa provider/modello `agentRuntime.id: "openclaw"` solo quando vuoi la route OpenClaw integrata; altrimenti mantieni `openai/gpt-5.5` sull'harness Codex predefinito.
- i riferimenti legacy Codex GPT sono stato legacy, non una route provider live. Usa `openai/gpt-5.5` sul runtime Codex nativo per la nuova configurazione agente, ed esegui `openclaw doctor --fix` per migrare i vecchi riferimenti modello Codex legacy ai riferimenti canonici `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni hosted in stile abbonamento

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/it/providers/zai">
    Piano Z.AI Coding o endpoint API generali.
  </Card>
  <Card title="MiniMax" href="/it/providers/minimax">
    OAuth del piano MiniMax Coding o accesso con chiave API.
  </Card>
  <Card title="Qwen Cloud" href="/it/providers/qwen">
    Superficie del provider Qwen Cloud più mapping degli endpoint Alibaba DashScope e Coding Plan.
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
- Rotazione opzionale: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override singolo)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione OpenClaw legacy che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` è accettato e normalizzato all'id live dell'API Gemini di Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il thinking dinamico di Google. Gemini 3/3.1 omettono un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del provider `cachedContents/...`; gli hit della cache Gemini appaiono come `cacheRead` di OpenClaw

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth

<Warning>
Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni degli account Google dopo l'uso di client di terze parti. Consulta i termini di Google e usa un account non critico se scegli di procedere.
</Warning>

Gemini CLI OAuth viene distribuito come parte del Plugin `google` incluso.

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

    Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`. **Non** incollare un client id o un secret in `openclaw.json`. Il flusso di accesso della CLI archivia i token nei profili auth sull'host Gateway.

  </Step>
  <Step title="Imposta il progetto (se necessario)">
    Se le richieste falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host Gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` per impostazione predefinita. OpenClaw legge i messaggi dello stream dell'assistente e normalizza `stats.cached` in `cacheRead`; gli override legacy `--output-format json` continuano a leggere il testo della risposta da `response`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - I riferimenti ai modelli usano l'ID provider canonico `zai/*`.
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Altri Plugin provider inclusi

| Provider                                | Id                               | Env auth                                             | Modello di esempio                                        |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                 | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/it/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth o `OPENROUTER_API_KEY`              | `openrouter/auto`                                          |
| [Qwen OAuth](/it/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth o `XAI_API_KEY`            | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particolarità utili da conoscere

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applica le proprie intestazioni di attribuzione dell'app e i marker Anthropic `cache_control` solo sulle route `openrouter.ai` verificate. I riferimenti DeepSeek, Moonshot e ZAI sono idonei al TTL della cache per il prompt caching gestito da OpenRouter, ma non ricevono marker di cache Anthropic. Come percorso proxy-style compatibile con OpenAI, salta lo shaping solo nativo OpenAI (`serviceTier`, Responses `store`, hint di prompt-cache, compatibilità reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanificazione proxy-Gemini delle thought-signature.
  </Accordion>
  <Accordion title="Kilo Gateway">
    I riferimenti basati su Gemini seguono lo stesso percorso di sanificazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy che non supportano il reasoning saltano l'iniezione del reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L'onboarding con chiave API scrive definizioni esplicite dei modelli chat M3 e M2.7; la comprensione delle immagini resta sul provider media `MiniMax-VL-01` di proprietà del Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Gli id dei modelli usano uno spazio dei nomi `nvidia/<vendor>/<model>` (per esempio `nvidia/nvidia/nemotron-...` accanto a `nvidia/moonshotai/kimi-k2.5`); i selettori preservano la composizione letterale `<provider>/<model-id>`, mentre la chiave canonica inviata all'API resta con un solo prefisso.
  </Accordion>
  <Accordion title="xAI">
    Usa il percorso Responses di xAI. Il percorso consigliato è SuperGrok/X Premium OAuth; le chiavi API funzionano ancora tramite `XAI_API_KEY` o la configurazione del Plugin, e `web_search` di Grok riutilizza lo stesso profilo auth prima del fallback alla chiave API. `grok-4.3` è il modello chat predefinito incluso, e `grok-build-0.1` è selezionabile per lavori focalizzati su build/coding. `/fast` o `params.fastMode: true` riscrive `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disabilitalo tramite `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Provider tramite `models.providers` (URL custom/base)

Usa `models.providers` (o `models.json`) per aggiungere provider **custom** o proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi sotto pubblicano già un catalogo predefinito. Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL di base, le intestazioni o l'elenco dei modelli.

I controlli delle capacità dei modelli del Gateway leggono anche i metadati espliciti `models.providers.<id>.models[]`. Se un modello personalizzato o proxy accetta immagini, imposta `input: ["text", "image"]` su quel modello, così WebChat e i percorsi degli allegati con origine Node passano le immagini come input nativi del modello invece che come riferimenti multimediali solo testuali.

`agents.defaults.models["provider/model"]` controlla solo la visibilità dei modelli, gli alias e i metadati per modello per gli agenti. Non registra da solo un nuovo modello di runtime. Per i modelli di provider personalizzati, aggiungi anche `models.providers.<provider>.models[]` con almeno l'`id` corrispondente.

### Moonshot AI (Kimi)

Installa `@openclaw/moonshot-provider` prima dell'onboarding. Aggiungi una voce esplicita `models.providers.moonshot` solo quando devi sostituire l'URL di base o i metadati del modello:

- Provider: `moonshot`
- Autenticazione: `MOONSHOT_API_KEY`
- Modello di esempio: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` o `openclaw onboard --auth-choice moonshot-api-key-cn`

ID dei modelli Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

### Sviluppo con Kimi

Kimi Coding usa l'endpoint compatibile con Anthropic di Moonshot AI:

- Provider: `kimi`
- Autenticazione: `KIMI_API_KEY`
- Modello di esempio: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

I vecchi `kimi/kimi-code` e `kimi/k2p5` restano accettati come ID modello di compatibilità e vengono normalizzati nell'ID del modello API stabile di Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornisce l'accesso a Doubao e ad altri modelli in Cina.

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

L'onboarding usa per impostazione predefinita la superficie di coding, ma il catalogo generale `volcengine/*` viene registrato allo stesso tempo.

Nei selettori di modelli di onboarding/configure, la scelta di autenticazione Volcengine preferisce sia le righe `volcengine/*` sia `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto limitato al provider.

<Tabs>
  <Tab title="Modelli standard">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Modelli di programmazione (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (internazionale)

BytePlus ARK fornisce accesso agli stessi modelli di Volcano Engine per gli utenti internazionali.

- Provider: `byteplus` (programmazione: `byteplus-plan`)
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

L'onboarding usa per impostazione predefinita la superficie di programmazione, ma il catalogo generale `byteplus/*` viene registrato contemporaneamente.

Nei selettori di modelli di onboarding/configure, la scelta di autenticazione BytePlus preferisce sia le righe `byteplus/*` sia `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto limitato al provider.

<Tabs>
  <Tab title="Modelli standard">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Modelli di programmazione (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic fornisce modelli compatibili con Anthropic tramite il provider `synthetic`:

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

- MiniMax OAuth (globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticazione: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`

Consulta [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

<Note>
Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il thinking per impostazione predefinita per la famiglia M2.x, a meno che tu non lo imposti esplicitamente; MiniMax-M3 (e M3.x) resta per impostazione predefinita sul percorso di thinking omesso/adattivo del provider. `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
</Note>

Suddivisione delle capability di proprietà del Plugin:

- Le impostazioni predefinite di testo/chat restano su `minimax/MiniMax-M3`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è di proprietà del Plugin `MiniMax-VL-01` su entrambi i percorsi di autenticazione MiniMax
- La ricerca web resta sull'id provider `minimax`

### LM Studio

LM Studio viene distribuito come Plugin provider in bundle che usa l'API nativa:

- Provider: `lmstudio`
- Autenticazione: `LM_API_TOKEN`
- URL di base predefinito per l'inferenza: `http://localhost:1234/v1`

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa gli endpoint nativi di LM Studio `/api/v1/models` e `/api/v1/models/load` per discovery + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita. Se vuoi che il caricamento JIT, il TTL e l'espulsione automatica di LM Studio gestiscano il ciclo di vita del modello, imposta `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama viene distribuito come Plugin provider in bundle e usa l'API nativa di Ollama:

- Provider: `ollama`
- Autenticazione: non richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando effettui l'opt-in con `OLLAMA_API_KEY`, e il Plugin provider in bundle aggiunge Ollama direttamente a `openclaw onboard` e al selettore di modelli. Consulta [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM viene distribuito come Plugin provider in bundle per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:8000/v1`

Per effettuare l'opt-in alla discovery automatica in locale (qualsiasi valore funziona se il tuo server non applica l'autenticazione):

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

SGLang viene distribuito come Plugin provider in bundle per server self-hosted veloci compatibili con OpenAI:

- Provider: `sglang`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:30000/v1`

Per effettuare l'opt-in alla discovery automatica in locale (qualsiasi valore funziona se il tuo server non applica l'autenticazione):

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
  <Accordion title="Campi facoltativi predefiniti">
    Per provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono facoltativi. Quando vengono omessi, OpenClaw usa come impostazione predefinita:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.

  </Accordion>
  <Accordion title="Regole di modellazione delle route proxy">
    - Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider per ruoli `developer` non supportati.
    - Le route in stile proxy compatibili con OpenAI saltano anche la modellazione delle richieste solo OpenAI native: niente `service_tier`, niente `store` di Responses, niente `store` di Completions, niente suggerimenti di cache dei prompt, niente modellazione del payload di compatibilità reasoning OpenAI e niente header nascosti di attribuzione OpenClaw.
    - Per i proxy Completions compatibili con OpenAI che richiedono campi specifici del vendor, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per unire JSON aggiuntivo nel corpo della richiesta in uscita.
    - Per i controlli dei chat-template di vLLM, imposta `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Il Plugin vLLM in bundle invia automaticamente `enable_thinking: false` e `force_nonempty_content: true` per `vllm/nemotron-3-*` quando il livello di thinking della sessione è disattivato.
    - Per modelli locali lenti o host LAN/tailnet remoti, imposta `models.providers.<id>.timeoutSeconds`. Questo estende la gestione delle richieste HTTP del modello provider, inclusi connessione, header, streaming del corpo e interruzione totale guarded-fetch, senza aumentare il timeout dell'intero runtime dell'agente. Se `agents.defaults.timeoutSeconds` o un timeout specifico dell'esecuzione è più basso, alza anche quel limite; i timeout del provider non possono estendere l'intera esecuzione.
    - Le chiamate HTTP ai provider di modelli consentono risposte DNS fake-IP di Surge, Clash e sing-box in `198.18.0.0/15` e `fc00::/7` solo per l'hostname `baseUrl` del provider configurato. Gli endpoint provider personalizzati/locali considerano attendibile anche l'origine esatta configurata `scheme://host:port` per richieste modello protette, inclusi host loopback, LAN e tailnet. Questa non è una nuova opzione di configurazione; il `baseUrl` che configuri estende la policy delle richieste solo per quell'origine. L'autorizzazione degli hostname fake-IP e la fiducia nell'origine esatta sono meccanismi indipendenti. Altre destinazioni private, loopback, link-local, metadata e porte diverse richiedono comunque un opt-in esplicito `models.providers.<id>.request.allowPrivateNetwork: true`. Imposta `models.providers.<id>.request.allowPrivateNetwork: false` per effettuare l'opt-out dalla fiducia nell'origine esatta.
    - Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che risolve in `api.openai.com`).
    - Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.
    - Per `api: "anthropic-messages"` su endpoint non diretti (qualsiasi provider diverso dal canonico `anthropic`, o un `models.providers.anthropic.baseUrl` personalizzato il cui host non sia un endpoint pubblico `api.anthropic.com`), OpenClaw sopprime gli header beta Anthropic impliciti come `claude-code-20250219`, `interleaved-thinking-2025-05-14` e i marker OAuth, in modo che i proxy personalizzati compatibili con Anthropic non rifiutino flag beta non supportati. Imposta esplicitamente `models.providers.<id>.headers["anthropic-beta"]` se il tuo proxy richiede funzionalità beta specifiche.

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
- [Failover dei modelli](/it/concepts/model-failover) - catene di fallback e comportamento dei nuovi tentativi
- [Modelli](/it/concepts/models) - configurazione dei modelli e alias
- [Provider](/it/providers) - guide di configurazione per provider
