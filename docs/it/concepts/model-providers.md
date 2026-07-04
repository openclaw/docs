---
read_when:
    - Hai bisogno di un riferimento per la configurazione dei modelli provider per provider
    - Vuoi configurazioni di esempio o comandi di onboarding CLI per i fornitori di modelli
sidebarTitle: Model providers
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-07-04T03:51:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Riferimento per **provider LLM/di modelli** (non canali chat come WhatsApp/Telegram). Per le regole di selezione dei modelli, consulta [Modelli](/it/concepts/models).

## Regole rapide

<AccordionGroup>
  <Accordion title="Riferimenti ai modelli e helper CLI">
    - I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` agisce come allowlist quando è impostato.
    - Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` impostano i valori predefiniti a livello di provider; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` li sovrascrivono per modello.
    - Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>
  <Accordion title="Aggiungere l'autenticazione di un provider non cambia il modello primario">
    `openclaw configure` preserva un `agents.defaults.model.primary` esistente quando aggiungi o riautentichi un provider. `openclaw models auth login` fa lo stesso, a meno che tu non passi `--set-default`. I Plugin provider possono comunque restituire un modello predefinito consigliato nella loro patch di configurazione dell'autenticazione, ma OpenClaw lo interpreta come "rendi disponibile questo modello" quando esiste gia un modello primario, non come "sostituisci il modello primario corrente."

    Per cambiare intenzionalmente il modello predefinito, usa `openclaw models set <provider/model>` o `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Separazione provider/runtime di OpenAI">
    Le route della famiglia OpenAI sono specifiche per prefisso:

    - `openai/<model>` usa per impostazione predefinita l'harness app-server Codex nativo per i turni dell'agente. Questa e la configurazione usuale per gli abbonamenti ChatGPT/Codex.
    - i riferimenti legacy ai modelli Codex sono configurazione legacy che doctor riscrive in `openai/<model>`.
    - `openai/<model>` piu provider/modello `agentRuntime.id: "openclaw"` usa il runtime integrato di OpenClaw per route esplicite con chiave API o di compatibilita.

    Consulta [OpenAI](/it/providers/openai) e [Harness Codex](/it/plugins/codex-harness). Se la separazione provider/runtime non e chiara, leggi prima [Runtime degli agenti](/it/concepts/agent-runtimes).

    L'abilitazione automatica dei Plugin segue lo stesso confine: i riferimenti agente `openai/*` abilitano il Plugin Codex per la route predefinita, e lo richiedono anche `agentRuntime.id: "codex"` esplicito a livello di provider/modello o i riferimenti legacy `codex/<model>`.

    GPT-5.5 e disponibile tramite l'harness app-server Codex nativo per impostazione predefinita su `openai/gpt-5.5`, e tramite il runtime OpenClaw quando la policy runtime provider/modello seleziona esplicitamente `openclaw`.

  </Accordion>
  <Accordion title="Runtime CLI">
    I runtime CLI usano la stessa separazione: scegli riferimenti canonici ai modelli come `anthropic/claude-*` o `google/gemini-*`, poi imposta la policy runtime provider/modello su `claude-cli` o `google-gemini-cli` quando vuoi un backend CLI locale.

    I riferimenti legacy `claude-cli/*` e `google-gemini-cli/*` migrano di nuovo a riferimenti provider canonici con il runtime registrato separatamente. I riferimenti legacy `codex-cli/*` migrano a `openai/*` e usano la route app-server Codex; OpenClaw non mantiene piu un backend Codex CLI in bundle.

  </Accordion>
</AccordionGroup>

## Comportamento dei provider di proprieta dei Plugin

La maggior parte della logica specifica dei provider vive nei Plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il ciclo di inferenza generico. I Plugin possiedono onboarding, cataloghi modelli, mappatura delle variabili d'ambiente per l'autenticazione, normalizzazione di trasporto/configurazione, pulizia degli schemi degli strumenti, classificazione del failover, refresh OAuth, reporting dell'uso, profili di thinking/reasoning e altro.

L'elenco completo degli hook provider-SDK e degli esempi di Plugin in bundle si trova in [Plugin provider](/it/plugins/sdk-provider-plugins). Un provider che necessita di un esecutore di richieste totalmente personalizzato e una superficie di estensione separata e piu profonda.

<Note>
Il comportamento del runner di proprieta del provider vive su hook provider espliciti come policy di replay, normalizzazione degli schemi degli strumenti, wrapping dello stream e helper di trasporto/richiesta. Il bag statico legacy `ProviderPlugin.capabilities` e solo per compatibilita e non viene piu letto dalla logica runner condivisa.
</Note>

## Rotazione delle chiavi API

<AccordionGroup>
  <Accordion title="Origini e priorita delle chiavi">
    Configura piu chiavi tramite:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live singolo, priorita massima)
    - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punti e virgola)
    - `<PROVIDER>_API_KEY` (chiave primaria)
    - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)

    Per i provider Google, anche `GOOGLE_API_KEY` e incluso come fallback. L'ordine di selezione delle chiavi preserva la priorita e deduplica i valori.

  </Accordion>
  <Accordion title="Quando si attiva la rotazione">
    - Le richieste vengono ritentate con la chiave successiva solo su risposte di rate limit (ad esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite d'uso).
    - Gli errori non dovuti a rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
    - Quando tutte le chiavi candidate falliscono, viene restituito l'errore finale dell'ultimo tentativo.

  </Accordion>
</AccordionGroup>

## Plugin provider ufficiali

I Plugin provider ufficiali pubblicano le proprie righe di catalogo modelli. Questi provider **non** richiedono voci modello in `models.providers`; abilita il Plugin provider, imposta l'autenticazione e scegli un modello. Usa `models.providers` solo per provider personalizzati espliciti o impostazioni di richiesta ristrette, come i timeout.

### OpenAI

- Provider: `openai`
- Autenticazione: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, piu `OPENCLAW_LIVE_OPENAI_KEY` (override singolo)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilita di account/modello con `openclaw models list --provider openai` se una specifica installazione o chiave API si comporta diversamente.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito e `auto`; OpenClaw passa la scelta del trasporto al runtime modello condiviso.
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- L'elaborazione prioritaria OpenAI puo essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste Responses dirette `openai/*` a `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche `store` di Responses, suggerimenti per la cache dei prompt e shaping del payload di compatibilita con il reasoning OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` e disponibile tramite autenticazione OAuth dell'abbonamento ChatGPT/Codex quando l'account con cui hai effettuato l'accesso lo espone; OpenClaw continua a sopprimere le route dirette con chiave API OpenAI e chiave API Azure per questo modello perche quei trasporti lo rifiutano

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Autenticazione: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, piu `OPENCLAW_LIVE_ANTHROPIC_KEY` (override singolo)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico con chiave API e autenticato OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa su `service_tier` di Anthropic (`auto` rispetto a `standard_only`)
- La configurazione Claude CLI preferita mantiene canonico il riferimento al modello e seleziona separatamente il backend CLI: `anthropic/claude-opus-4-8` con `agentRuntime.id: "claude-cli"` con scope modello. I riferimenti legacy `claude-cli/claude-opus-4-7` continuano a funzionare per compatibilita.

<Note>
Lo staff Anthropic ci ha comunicato che l'uso di Claude CLI in stile OpenClaw e di nuovo consentito, quindi OpenClaw considera il riuso di Claude CLI e l'uso di `claude -p` autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Il setup-token Anthropic resta disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Provider: `openai`
- Autenticazione: OAuth (ChatGPT)
- Riferimento legacy al modello OpenAI Codex: `openai/gpt-5.5`
- Riferimento all'harness app-server Codex nativo: `openai/gpt-5.5`
- Documentazione dell'harness app-server Codex nativo: [Harness Codex](/it/plugins/codex-harness)
- Riferimenti modello legacy: `codex/gpt-*`
- Confine Plugin: `openai/*` carica il Plugin OpenAI; il Plugin app-server Codex nativo viene selezionato dal runtime dell'harness Codex.
- CLI: `openclaw onboard --auth-choice openai` o `openclaw models auth login --provider openai`
- Il trasporto predefinito e `auto` (prima WebSocket, fallback SSE)
- Override per modello OpenAI Codex tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Anche `params.serviceTier` viene inoltrato sulle richieste Responses Codex native (`chatgpt.com/backend-api`)
- Gli header nascosti di attribuzione OpenClaw (`originator`, `version`, `User-Agent`) vengono allegati solo al traffico Codex nativo verso `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw li mappa a `service_tier=priority`
- `openai/gpt-5.5` usa il `contextWindow = 400000` nativo del catalogo Codex e il runtime predefinito `contextTokens = 272000`; sovrascrivi il limite runtime con `models.providers.openai.models[].contextTokens`
- Nota di policy: OAuth OpenAI Codex e esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- Per la route comune con abbonamento piu runtime Codex nativo, accedi con autenticazione `openai` e configura `openai/gpt-5.5`; i turni agente OpenAI selezionano Codex per impostazione predefinita.
- Usa provider/modello `agentRuntime.id: "openclaw"` solo quando vuoi la route OpenClaw integrata; altrimenti mantieni `openai/gpt-5.5` sull'harness Codex predefinito.
- i riferimenti legacy GPT Codex sono stato legacy, non una route provider live. Usa `openai/gpt-5.5` sul runtime Codex nativo per la nuova configurazione agente ed esegui `openclaw doctor --fix` per migrare i vecchi riferimenti legacy ai modelli Codex nei riferimenti canonici `openai/*`.

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
    Z.AI Coding Plan o endpoint API generali.
  </Card>
  <Card title="MiniMax" href="/it/providers/minimax">
    MiniMax Coding Plan OAuth o accesso con chiave API.
  </Card>
  <Card title="Qwen Cloud" href="/it/providers/qwen">
    Superficie provider Qwen Cloud piu mappatura degli endpoint Alibaba DashScope e Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Autenticazione: `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`)
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

- Fornitore: `google`
- Autenticazione: `GEMINI_API_KEY`
- Rotazione opzionale: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override singolo)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione OpenClaw legacy che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` è accettato e normalizzato nell'id API Gemini live di Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il thinking dinamico di Google. Gemini 3/3.1 omettono un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni Gemini dirette accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del fornitore `cachedContents/...`; gli hit della cache Gemini emergono come OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Fornitori: `google-vertex`, `google-gemini-cli`
- Autenticazione: Vertex usa gcloud ADC; Gemini CLI usa il proprio flusso OAuth

<Warning>
Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni sugli account Google dopo l'uso di client di terze parti. Esamina i termini di Google e usa un account non critico se scegli di procedere.
</Warning>

Gemini CLI OAuth viene distribuito come parte del plugin `google` incluso.

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
  <Step title="Abilita il plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Accedi">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`. **Non** incolli un client id o un secret in `openclaw.json`. Il flusso di login della CLI archivia i token nei profili di autenticazione sull'host del gateway.

  </Step>
  <Step title="Imposta il progetto (se necessario)">
    Se le richieste non riescono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway.
  </Step>
</Steps>

Gemini CLI usa `stream-json` per impostazione predefinita. OpenClaw legge i messaggi dello stream dell'assistente
e normalizza `stats.cached` in `cacheRead`; gli override legacy
`--output-format json` continuano a leggere il testo della risposta da `response`.

### Z.AI (GLM)

- Fornitore: `zai`
- Autenticazione: `ZAI_API_KEY`
- Modello di esempio: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - I riferimenti ai modelli usano l'ID fornitore canonico `zai/*`.
  - `zai-api-key` rileva automaticamente l'endpoint Z.AI corrispondente; `zai-coding-global`, `zai-coding-cn`, `zai-global` e `zai-cn` forzano una superficie specifica

### Vercel AI Gateway

- Fornitore: `vercel-ai-gateway`
- Autenticazione: `AI_GATEWAY_API_KEY`
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Altri plugin di fornitori inclusi

| Fornitore                               | Id                               | Env di autenticazione                                | Modello di esempio                                        |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                           |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                  |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`                 | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/it/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth o `OPENROUTER_API_KEY`              | `openrouter/auto`                                         |
| [Qwen OAuth](/it/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth o `XAI_API_KEY`            | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Particolarità utili da conoscere

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applica i propri header di attribuzione dell'app e i marker Anthropic `cache_control` solo sulle route `openrouter.ai` verificate. I riferimenti DeepSeek, Moonshot e ZAI sono idonei al cache-TTL per la cache dei prompt gestita da OpenRouter, ma non ricevono marker della cache Anthropic. Come percorso proxy in stile compatibile con OpenAI, salta lo shaping solo nativo OpenAI (`serviceTier`, Responses `store`, hint della cache dei prompt, compatibilità del reasoning OpenAI). I riferimenti basati su Gemini mantengono solo la sanificazione delle thought-signature proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    I riferimenti basati su Gemini seguono lo stesso percorso di sanificazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy non supportati dal reasoning saltano l'iniezione del reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L'onboarding con chiave API scrive definizioni esplicite dei modelli chat M3 e M2.7; la comprensione delle immagini resta sul fornitore media `MiniMax-VL-01` di proprietà del plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Gli id dei modelli usano uno spazio dei nomi `nvidia/<vendor>/<model>` (ad esempio `nvidia/nvidia/nemotron-...` insieme a `nvidia/moonshotai/kimi-k2.5`); i selettori preservano la composizione letterale `<provider>/<model-id>` mentre la chiave canonica inviata all'API resta con prefisso singolo.
  </Accordion>
  <Accordion title="xAI">
    Usa il percorso Responses di xAI. Il percorso consigliato è SuperGrok/X Premium OAuth; le chiavi API continuano a funzionare tramite `XAI_API_KEY` o configurazione del plugin, e Grok `web_search` riusa lo stesso profilo di autenticazione prima del fallback alla chiave API. `grok-4.3` è il modello chat predefinito incluso, e `grok-build-0.1` è selezionabile per lavoro orientato a build/coding. `/fast` o `params.fastMode: true` riscrive `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disabilitalo tramite `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Fornitori tramite `models.providers` (URL custom/base)

Usa `models.providers` (o `models.json`) per aggiungere fornitori **personalizzati** o proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi nel pacchetto qui sotto pubblicano già un catalogo predefinito. Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL di base predefinito, le intestazioni o l'elenco dei modelli.

I controlli delle capacità dei modelli del Gateway leggono anche i metadati espliciti `models.providers.<id>.models[]`. Se un modello personalizzato o proxy accetta immagini, imposta `input: ["text", "image"]` su quel modello, così WebChat e i percorsi degli allegati di origine Node passano le immagini come input nativi del modello invece che come riferimenti multimediali solo testuali.

`agents.defaults.models["provider/model"]` controlla solo la visibilità dei modelli, gli alias e i metadati per modello per gli agenti. Non registra da solo un nuovo modello runtime. Per i modelli di provider personalizzati, aggiungi anche `models.providers.<provider>.models[]` con almeno l'`id` corrispondente.

### Moonshot AI (Kimi)

Installa `@openclaw/moonshot-provider` prima dell'onboarding. Aggiungi una voce esplicita `models.providers.moonshot` solo quando devi sovrascrivere l'URL di base o i metadati del modello:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
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

### Coding con Kimi

Kimi Coding usa l'endpoint compatibile con Anthropic di Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Modello di esempio: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

I valori legacy `kimi/kimi-code` e `kimi/k2p5` restano accettati come ID modello di compatibilità e vengono normalizzati all'ID modello API stabile di Kimi.

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

L'onboarding usa per impostazione predefinita la superficie di programmazione, ma il catalogo generale `volcengine/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta di autenticazione Volcengine preferisce sia le righe `volcengine/*` sia le righe `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto con ambito al provider.

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

BytePlus ARK fornisce agli utenti internazionali accesso agli stessi modelli di Volcano Engine.

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

L'onboarding usa per impostazione predefinita la superficie di programmazione, ma il catalogo generale `byteplus/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configure, la scelta di autenticazione BytePlus preferisce sia le righe `byteplus/*` sia le righe `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto con ambito al provider.

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

Consulta [/providers/minimax](/it/providers/minimax) per dettagli di configurazione, opzioni dei modelli e frammenti di configurazione.

<Note>
Nel percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita per impostazione predefinita il ragionamento per la famiglia M2.x, a meno che tu non lo imposti esplicitamente; MiniMax-M3 (e M3.x) rimane per impostazione predefinita sul percorso di ragionamento omesso/adattivo del provider. `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
</Note>

Suddivisione delle capacità di proprietà del Plugin:

- I predefiniti per testo/chat rimangono su `minimax/MiniMax-M3`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, di proprietà del Plugin, su entrambi i percorsi di autenticazione MiniMax
- La ricerca web rimane sull'ID provider `minimax`

### LM Studio

LM Studio viene distribuito come Plugin provider in bundle che usa l'API nativa:

- Provider: `lmstudio`
- Autenticazione: `LM_API_TOKEN`
- URL base di inferenza predefinito: `http://localhost:1234/v1`

Poi imposta un modello (sostituiscilo con uno degli ID restituiti da `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw usa `/api/v1/models` e `/api/v1/models/load` nativi di LM Studio per discovery e caricamento automatico, con `/v1/chat/completions` per impostazione predefinita per l'inferenza. Se vuoi che caricamento JIT, TTL ed espulsione automatica di LM Studio gestiscano il ciclo di vita del modello, imposta `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama viene distribuito come Plugin provider in bundle e usa l'API nativa di Ollama:

- Provider: `ollama`
- Autenticazione: nessuna richiesta (server locale)
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando acconsenti con `OLLAMA_API_KEY`, e il Plugin provider in bundle aggiunge Ollama direttamente a `openclaw onboard` e al selettore di modello. Consulta [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM viene distribuito come Plugin provider in bundle per server locali/self-hosted compatibili con OpenAI:

- Provider: `vllm`
- Autenticazione: opzionale (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:8000/v1`

Per abilitare l'auto-discovery localmente (qualsiasi valore va bene se il tuo server non applica l'autenticazione):

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
- Autenticazione: opzionale (dipende dal tuo server)
- URL base predefinito: `http://127.0.0.1:30000/v1`

Per abilitare l'auto-discovery localmente (qualsiasi valore va bene se il tuo server non applica l'autenticazione):

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
    Per i provider personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono opzionali. Quando vengono omessi, OpenClaw usa questi valori predefiniti:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del provider per ruoli `developer` non supportati.
    - Anche le route in stile proxy compatibili con OpenAI saltano la modellazione delle richieste solo nativa OpenAI: niente `service_tier`, niente `store` di Responses, niente `store` di Completions, niente suggerimenti per prompt-cache, niente modellazione del payload di compatibilità del ragionamento OpenAI e niente intestazioni di attribuzione OpenClaw nascoste.
    - Per proxy Completions compatibili con OpenAI che richiedono campi specifici del vendor, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per unire JSON aggiuntivo al corpo della richiesta in uscita.
    - Per i controlli del chat-template di vLLM, imposta `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Il Plugin vLLM in bundle invia automaticamente `enable_thinking: false` e `force_nonempty_content: true` per `vllm/nemotron-3-*` quando il livello di ragionamento della sessione è disattivato.
    - Per modelli locali lenti o host LAN/tailnet remoti, imposta `models.providers.<id>.timeoutSeconds`. Questo estende la gestione delle richieste HTTP del modello del provider, inclusi connessione, intestazioni, streaming del corpo e abort totale del guarded-fetch, senza aumentare il timeout dell'intero runtime dell'agente. Se `agents.defaults.timeoutSeconds` o un timeout specifico dell'esecuzione è inferiore, aumenta anche quel limite; i timeout del provider non possono estendere l'intera esecuzione.
    - Le chiamate HTTP al provider del modello consentono risposte DNS fake-IP di Surge, Clash e sing-box in `198.18.0.0/15` e `fc00::/7` solo per l'hostname `baseUrl` del provider configurato. Gli endpoint provider personalizzati/locali considerano attendibile anche l'origine esatta configurata `scheme://host:port` per le richieste modello protette, inclusi host loopback, LAN e tailnet. Questa non è una nuova opzione di configurazione; il `baseUrl` che configuri estende la policy di richiesta solo per quell'origine. L'autorizzazione dell'hostname fake-IP e la fiducia dell'origine esatta sono meccanismi indipendenti. Altre destinazioni private, loopback, link-local, metadata e porte diverse richiedono comunque un opt-in esplicito `models.providers.<id>.request.allowPrivateNetwork: true`. Imposta `models.providers.<id>.request.allowPrivateNetwork: false` per disattivare la fiducia dell'origine esatta.
    - Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento OpenAI predefinito (che si risolve in `api.openai.com`).
    - Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto sugli endpoint `openai-completions` non nativi.
    - Per `api: "anthropic-messages"` su endpoint non diretti (qualsiasi provider diverso da `anthropic` canonico, o un `models.providers.anthropic.baseUrl` personalizzato il cui host non sia un endpoint pubblico `api.anthropic.com`), OpenClaw sopprime le intestazioni beta Anthropic implicite come `claude-code-20250219`, `interleaved-thinking-2025-05-14` e i marcatori OAuth, in modo che i proxy personalizzati compatibili con Anthropic non rifiutino flag beta non supportati. Imposta esplicitamente `models.providers.<id>.headers["anthropic-beta"]` se il tuo proxy richiede funzionalità beta specifiche.

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

- [Riferimento di configurazione](/it/gateway/config-agents#agent-defaults) - chiavi di configurazione del modello
- [Failover dei modelli](/it/concepts/model-failover) - catene di fallback e comportamento di retry
- [Modelli](/it/concepts/models) - configurazione e alias dei modelli
- [Provider](/it/providers) - guide di configurazione per provider
