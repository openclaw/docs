---
read_when:
    - Serve un riferimento per la configurazione dei modelli per ciascun provider
    - Vuoi configurazioni di esempio o comandi di onboarding della CLI per i provider di modelli
sidebarTitle: Model providers
summary: Panoramica dei provider di modelli con configurazioni di esempio + flussi CLI
title: Provider di modelli
x-i18n:
    generated_at: "2026-05-11T20:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Riferimento per i **provider LLM/modelli** (non canali di chat come WhatsApp/Telegram). Per le regole di selezione dei modelli, consulta [Modelli](/it/concepts/models).

## Regole rapide

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - I riferimenti ai modelli usano `provider/model` (esempio: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` agisce come allowlist quando impostato.
    - Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` impostano i valori predefiniti a livello di provider; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` li sovrascrivono per modello.
    - Regole di fallback, probe di cooldown e persistenza degli override di sessione: [Failover dei modelli](/it/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` conserva un `agents.defaults.model.primary` esistente quando aggiungi o riautentichi un provider. `openclaw models auth login` fa lo stesso, a meno che tu non passi `--set-default`. I Plugin provider possono comunque restituire un modello predefinito consigliato nella loro patch di configurazione auth, ma OpenClaw lo interpreta come "rendi disponibile questo modello" quando esiste già un modello primario, non come "sostituisci il modello primario corrente."

    Per cambiare intenzionalmente il modello predefinito, usa `openclaw models set <provider/model>` oppure `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    Le route della famiglia OpenAI sono specifiche per prefisso:

    - `openai/<model>` usa per impostazione predefinita l'harness app-server Codex nativo per i turni dell'agente. Questa è la configurazione abituale per l'abbonamento ChatGPT/Codex.
    - `openai-codex/<model>` è una configurazione legacy che doctor riscrive in `openai/<model>`.
    - `openai/<model>` più `agentRuntime.id: "pi"` di provider/modello usa PI per route esplicite con chiave API o compatibilità.

    Consulta [OpenAI](/it/providers/openai) e [Harness Codex](/it/plugins/codex-harness). Se la separazione provider/runtime crea confusione, leggi prima [Runtime degli agenti](/it/concepts/agent-runtimes).

    L'abilitazione automatica dei Plugin segue lo stesso confine: i riferimenti agente `openai/*` abilitano il Plugin Codex per la route predefinita, e anche `agentRuntime.id: "codex"` esplicito di provider/modello o i riferimenti legacy `codex/<model>` lo richiedono.

    GPT-5.5 è disponibile tramite l'harness app-server Codex nativo per impostazione predefinita su `openai/gpt-5.5`, e tramite PI solo quando la policy runtime di provider/modello seleziona esplicitamente `pi`.

  </Accordion>
  <Accordion title="CLI runtimes">
    I runtime CLI usano la stessa separazione: scegli riferimenti di modello canonici come `anthropic/claude-*`, `google/gemini-*` o `openai/gpt-*`, poi imposta la policy runtime di provider/modello su `claude-cli`, `google-gemini-cli` o `codex-cli` quando vuoi un backend CLI locale.

    I riferimenti legacy `claude-cli/*`, `google-gemini-cli/*` e `codex-cli/*` vengono migrati di nuovo a riferimenti provider canonici con il runtime registrato separatamente.

  </Accordion>
</AccordionGroup>

## Comportamento dei provider di proprietà dei Plugin

La maggior parte della logica specifica dei provider vive nei Plugin provider (`registerProvider(...)`), mentre OpenClaw mantiene il ciclo di inferenza generico. I Plugin possiedono onboarding, cataloghi dei modelli, mapping delle variabili d'ambiente per l'autenticazione, normalizzazione di trasporto/configurazione, pulizia degli schemi degli strumenti, classificazione del failover, refresh OAuth, report di utilizzo, profili di pensiero/ragionamento e altro.

L'elenco completo degli hook del provider SDK e degli esempi di Plugin in bundle si trova in [Plugin provider](/it/plugins/sdk-provider-plugins). Un provider che richiede un esecutore di richieste totalmente personalizzato è una superficie di estensione separata e più profonda.

<Note>
Il comportamento del runner di proprietà del provider vive su hook provider espliciti come policy di replay, normalizzazione degli schemi degli strumenti, wrapping dello stream e helper di trasporto/richiesta. La vecchia sacca statica `ProviderPlugin.capabilities` è solo per compatibilità e non viene più letta dalla logica condivisa del runner.
</Note>

## Rotazione delle chiavi API

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Configura più chiavi tramite:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override live singolo, priorità massima)
    - `<PROVIDER>_API_KEYS` (elenco separato da virgole o punti e virgola)
    - `<PROVIDER>_API_KEY` (chiave primaria)
    - `<PROVIDER>_API_KEY_*` (elenco numerato, ad esempio `<PROVIDER>_API_KEY_1`)

    Per i provider Google, anche `GOOGLE_API_KEY` è incluso come fallback. L'ordine di selezione delle chiavi preserva la priorità e deduplica i valori.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - Le richieste vengono ritentate con la chiave successiva solo in caso di risposte di rate limit (ad esempio `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` o messaggi periodici di limite di utilizzo).
    - Gli errori che non sono rate limit falliscono immediatamente; non viene tentata alcuna rotazione delle chiavi.
    - Quando tutte le chiavi candidate falliscono, l'errore finale viene restituito dall'ultimo tentativo.

  </Accordion>
</AccordionGroup>

## Provider integrati (catalogo pi-ai)

OpenClaw viene fornito con il catalogo pi-ai. Questi provider non richiedono **alcuna** configurazione `models.providers`; basta impostare l'autenticazione e scegliere un modello.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotazione opzionale: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, più `OPENCLAW_LIVE_OPENAI_KEY` (override singolo)
- Modelli di esempio: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Verifica la disponibilità dell'account/modello con `openclaw models list --provider openai` se una specifica installazione o chiave API si comporta in modo diverso.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Il trasporto predefinito è `auto`; OpenClaw passa la scelta del trasporto a pi-ai.
- Override per modello tramite `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- L'elaborazione prioritaria di OpenAI può essere abilitata tramite `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` e `params.fastMode` mappano le richieste Responses dirette `openai/*` su `service_tier=priority` su `api.openai.com`
- Usa `params.serviceTier` quando vuoi un tier esplicito invece del toggle condiviso `/fast`
- Le intestazioni di attribuzione nascoste di OpenClaw (`originator`, `version`, `User-Agent`) si applicano solo al traffico OpenAI nativo verso `api.openai.com`, non ai proxy generici compatibili con OpenAI
- Le route OpenAI native mantengono anche `store` di Responses, suggerimenti per la prompt-cache e shaping del payload compatibile con il ragionamento OpenAI; le route proxy no
- `openai/gpt-5.3-codex-spark` è intenzionalmente soppresso in OpenClaw perché le richieste API OpenAI live lo rifiutano e il catalogo Codex corrente non lo espone

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotazione opzionale: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, più `OPENCLAW_LIVE_ANTHROPIC_KEY` (override singolo)
- Modello di esempio: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Le richieste Anthropic pubbliche dirette supportano il toggle condiviso `/fast` e `params.fastMode`, incluso il traffico autenticato con chiave API e OAuth inviato a `api.anthropic.com`; OpenClaw lo mappa su `service_tier` di Anthropic (`auto` vs `standard_only`)
- La configurazione Claude CLI preferita mantiene canonico il riferimento al modello e seleziona il backend CLI separatamente: `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` nello scope del modello. I riferimenti legacy `claude-cli/claude-opus-4-7` funzionano ancora per compatibilità.

<Note>
Lo staff di Anthropic ci ha comunicato che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera il riutilizzo di Claude CLI e l'uso di `claude -p` autorizzati per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Il setup-token di Anthropic resta disponibile come percorso token supportato da OpenClaw, ma OpenClaw ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Riferimento modello PI legacy: `openai-codex/gpt-5.5`
- Riferimento harness app-server Codex nativo: `openai/gpt-5.5`
- Documentazione dell'harness app-server Codex nativo: [Harness Codex](/it/plugins/codex-harness)
- Riferimenti modello legacy: `codex/gpt-*`
- Confine Plugin: `openai-codex/*` carica il Plugin OpenAI; il Plugin app-server Codex nativo viene selezionato solo dal runtime dell'harness Codex o dai riferimenti legacy `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` o `openclaw models auth login --provider openai-codex`
- Il trasporto predefinito è `auto` (prima WebSocket, fallback SSE)
- Override per modello PI tramite `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` o `"auto"`)
- Anche `params.serviceTier` viene inoltrato sulle richieste Responses Codex native (`chatgpt.com/backend-api`)
- Le intestazioni di attribuzione nascoste di OpenClaw (`originator`, `version`, `User-Agent`) vengono allegate solo al traffico Codex nativo verso `chatgpt.com/backend-api`, non ai proxy generici compatibili con OpenAI
- Condivide lo stesso toggle `/fast` e la stessa configurazione `params.fastMode` di `openai/*` diretto; OpenClaw li mappa su `service_tier=priority`
- `openai-codex/gpt-5.5` usa il catalogo Codex nativo `contextWindow = 400000` e il runtime predefinito `contextTokens = 272000`; sovrascrivi il limite runtime con `models.providers.openai-codex.models[].contextTokens`
- Nota di policy: OpenAI Codex OAuth è esplicitamente supportato per strumenti/workflow esterni come OpenClaw.
- Per la route comune con abbonamento più runtime Codex nativo, accedi con autenticazione `openai-codex` ma configura `openai/gpt-5.5`; i turni agente OpenAI selezionano Codex per impostazione predefinita.
- Usa `agentRuntime.id: "pi"` di provider/modello solo quando vuoi una route di compatibilità tramite PI; altrimenti mantieni `openai/gpt-5.5` sull'harness Codex predefinito.
- I riferimenti meno recenti `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` e `openai-codex/gpt-5.3*` sono soppressi perché gli account OAuth ChatGPT/Codex li rifiutano; usa invece `openai-codex/gpt-5.5` o la route runtime Codex nativa.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Altre opzioni ospitate in stile abbonamento

<CardGroup cols={3}>
  <Card title="GLM models" href="/it/providers/glm">
    Piano Z.AI Coding o endpoint API generali.
  </Card>
  <Card title="MiniMax" href="/it/providers/minimax">
    OAuth del piano MiniMax Coding o accesso con chiave API.
  </Card>
  <Card title="Qwen Cloud" href="/it/providers/qwen">
    Superficie provider Qwen Cloud più mapping degli endpoint Alibaba DashScope e Coding Plan.
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
- Autenticazione: `GEMINI_API_KEY`
- Rotazione facoltativa: fallback `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` e `OPENCLAW_LIVE_GEMINI_KEY` (override singolo)
- Modelli di esempio: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilità: la configurazione OpenClaw legacy che usa `google/gemini-3.1-flash-preview` viene normalizzata in `google/gemini-3-flash-preview`
- Alias: `google/gemini-3.1-pro` è accettato e normalizzato nell'id API Gemini live di Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` usa il thinking dinamico di Google. Gemini 3/3.1 omette un `thinkingLevel` fisso; Gemini 2.5 invia `thinkingBudget: -1`.
- Le esecuzioni dirette di Gemini accettano anche `agents.defaults.models["google/<model>"].params.cachedContent` (o il legacy `cached_content`) per inoltrare un handle nativo del provider `cachedContents/...`; gli hit della cache Gemini emergono come OpenClaw `cacheRead`

### Google Vertex e Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Autenticazione: Vertex usa ADC di gcloud; Gemini CLI usa il proprio flusso OAuth

<Warning>
Gemini CLI OAuth in OpenClaw è un'integrazione non ufficiale. Alcuni utenti hanno segnalato restrizioni dell'account Google dopo l'uso di client di terze parti. Esamina i termini di Google e usa un account non critico se scegli di procedere.
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

    Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`. **Non** incollare un client id o un segreto in `openclaw.json`. Il flusso di accesso della CLI archivia i token nei profili di autenticazione sull'host Gateway.

  </Step>
  <Step title="Imposta il progetto (se necessario)">
    Se le richieste non riescono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host Gateway.
  </Step>
</Steps>

Le risposte JSON di Gemini CLI vengono analizzate da `response`; l'uso ripiega su `stats`, con `stats.cached` normalizzato in OpenClaw `cacheRead`.

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
- Modelli di esempio: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Autenticazione: `KILOCODE_API_KEY`
- Modello di esempio: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL di base: `https://api.kilo.ai/api/gateway/`
- Il catalogo di fallback statico include `kilocode/kilo/auto`; il rilevamento live di `https://api.kilo.ai/api/gateway/models` può espandere ulteriormente il catalogo di runtime.
- Il routing upstream esatto dietro `kilocode/kilo/auto` è di proprietà di Kilo Gateway, non codificato direttamente in OpenClaw.

Consulta [/providers/kilocode](/it/providers/kilocode) per i dettagli di configurazione.

### Altri Plugin provider inclusi

| Fornitore               | ID                               | Env di autenticazione                                       | Modello di esempio                            |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` o `KIMICODE_API_KEY`                          | `kimi/kimi-for-coding`                        |
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

#### Particolarità utili da conoscere

<AccordionGroup>
  <Accordion title="OpenRouter">
    Applica le sue intestazioni di attribuzione dell'app e i marcatori Anthropic `cache_control` solo su route `openrouter.ai` verificate. I riferimenti DeepSeek, Moonshot e ZAI sono idonei al TTL della cache per la memorizzazione nella cache dei prompt gestita da OpenRouter, ma non ricevono marcatori di cache Anthropic. Come percorso compatibile con OpenAI in stile proxy, salta la modellazione riservata a OpenAI nativo (`serviceTier`, Responses `store`, suggerimenti per la cache dei prompt, compatibilità del ragionamento OpenAI). I riferimenti basati su Gemini mantengono solo la sanificazione della firma di pensiero proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    I riferimenti basati su Gemini seguono lo stesso percorso di sanificazione proxy-Gemini; `kilocode/kilo/auto` e altri riferimenti proxy che non supportano il ragionamento saltano l'iniezione del ragionamento proxy.
  </Accordion>
  <Accordion title="MiniMax">
    L'onboarding con chiave API scrive definizioni esplicite del modello di chat M2.7 solo testo; la comprensione delle immagini resta sul provider multimediale `MiniMax-VL-01` di proprietà del Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    Gli ID modello usano uno spazio dei nomi `nvidia/<vendor>/<model>` (per esempio `nvidia/nvidia/nemotron-...` insieme a `nvidia/moonshotai/kimi-k2.5`); i selettori preservano la composizione letterale `<provider>/<model-id>`, mentre la chiave canonica inviata all'API resta con un solo prefisso.
  </Accordion>
  <Accordion title="xAI">
    Usa il percorso xAI Responses. `grok-4.3` è il modello di chat predefinito incluso. `/fast` o `params.fastMode: true` riscrive `grok-3`, `grok-3-mini`, `grok-4` e `grok-4-0709` nelle rispettive varianti `*-fast`. `tool_stream` è attivo per impostazione predefinita; disattivalo tramite `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Viene distribuito come Plugin provider `cerebras` incluso. GLM usa `zai-glm-4.7`; l'URL di base compatibile con OpenAI è `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Fornitori tramite `models.providers` (personalizzati/URL di base)

Usa `models.providers` (o `models.json`) per aggiungere fornitori **personalizzati** o proxy compatibili con OpenAI/Anthropic.

Molti dei Plugin provider inclusi qui sotto pubblicano già un catalogo predefinito. Usa voci esplicite `models.providers.<id>` solo quando vuoi sovrascrivere l'URL di base predefinito, le intestazioni o l'elenco dei modelli.

Anche i controlli delle capacità dei modelli del Gateway leggono i metadati espliciti `models.providers.<id>.models[]`. Se un modello personalizzato o proxy accetta immagini, imposta `input: ["text", "image"]` su quel modello, così WebChat e i percorsi degli allegati originati dal nodo passano le immagini come input nativi del modello invece che come riferimenti multimediali solo testo.

`agents.defaults.models["provider/model"]` controlla solo la visibilità del modello, gli alias e i metadati per modello degli agenti. Da solo non registra un nuovo modello runtime. Per i modelli di fornitori personalizzati, aggiungi anche `models.providers.<provider>.models[]` con almeno l'`id` corrispondente.

### Moonshot AI (Kimi)

Moonshot viene distribuito come Plugin provider incluso. Usa il provider integrato per impostazione predefinita e aggiungi una voce esplicita `models.providers.moonshot` solo quando devi sovrascrivere l'URL di base o i metadati del modello:

- Fornitore: `moonshot`
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

- Fornitore: `kimi`
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

I legacy `kimi/kimi-code` e `kimi/k2p5` restano accettati come ID modello di compatibilità e vengono normalizzati all'ID modello API stabile di Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fornisce accesso a Doubao e ad altri modelli in Cina.

- Fornitore: `volcengine` (coding: `volcengine-plan`)
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

L'onboarding usa come predefinita la superficie di coding, ma il catalogo generale `volcengine/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configurazione, la scelta di autenticazione Volcengine preferisce sia le righe `volcengine/*` sia le righe `volcengine-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto con ambito limitato al fornitore.

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

- Fornitore: `byteplus` (coding: `byteplus-plan`)
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

L'onboarding usa come predefinita la superficie di coding, ma il catalogo generale `byteplus/*` viene registrato nello stesso momento.

Nei selettori di modello di onboarding/configurazione, la scelta di autenticazione BytePlus preferisce sia le righe `byteplus/*` sia le righe `byteplus-plan/*`. Se quei modelli non sono ancora caricati, OpenClaw ripiega sul catalogo non filtrato invece di mostrare un selettore vuoto con ambito limitato al fornitore.

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

Synthetic fornisce modelli compatibili con Anthropic dietro il fornitore `synthetic`:

- Fornitore: `synthetic`
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

MiniMax è configurato tramite `models.providers` perché usa endpoint personalizzati:

- MiniMax OAuth (globale): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Chiave API MiniMax (globale): `--auth-choice minimax-global-api`
- Chiave API MiniMax (CN): `--auth-choice minimax-cn-api`
- Autenticazione: `MINIMAX_API_KEY` per `minimax`; `MINIMAX_OAUTH_TOKEN` o `MINIMAX_API_KEY` per `minimax-portal`

Consulta [/providers/minimax](/it/providers/minimax) per i dettagli di configurazione, le opzioni dei modelli e gli snippet di configurazione.

<Note>
Sul percorso di streaming compatibile con Anthropic di MiniMax, OpenClaw disabilita il ragionamento per impostazione predefinita a meno che tu non lo imposti esplicitamente, e `/fast on` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
</Note>

Suddivisione delle capability di proprietà del Plugin:

- I predefiniti per testo/chat restano su `minimax/MiniMax-M2.7`
- La generazione di immagini è `minimax/image-01` o `minimax-portal/image-01`
- La comprensione delle immagini è `MiniMax-VL-01`, di proprietà del Plugin, su entrambi i percorsi di autenticazione MiniMax
- La ricerca web resta sull'ID fornitore `minimax`

### LM Studio

LM Studio è distribuito come Plugin fornitore incluso che usa l'API nativa:

- Fornitore: `lmstudio`
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

OpenClaw usa i nativi `/api/v1/models` e `/api/v1/models/load` di LM Studio per discovery + caricamento automatico, con `/v1/chat/completions` per l'inferenza per impostazione predefinita. Se vuoi che il caricamento JIT, il TTL e l'auto-evict di LM Studio gestiscano il ciclo di vita del modello, imposta `models.providers.lmstudio.params.preload: false`. Consulta [/providers/lmstudio](/it/providers/lmstudio) per configurazione e risoluzione dei problemi.

### Ollama

Ollama è distribuito come Plugin fornitore incluso e usa l'API nativa di Ollama:

- Fornitore: `ollama`
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

Ollama viene rilevato localmente su `http://127.0.0.1:11434` quando abiliti esplicitamente con `OLLAMA_API_KEY`, e il Plugin fornitore incluso aggiunge Ollama direttamente a `openclaw onboard` e al selettore di modelli. Consulta [/providers/ollama](/it/providers/ollama) per onboarding, modalità cloud/locale e configurazione personalizzata.

### vLLM

vLLM è distribuito come Plugin fornitore incluso per server locali/self-hosted compatibili con OpenAI:

- Fornitore: `vllm`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:8000/v1`

Per abilitare esplicitamente la discovery automatica locale (qualsiasi valore va bene se il tuo server non applica l'autenticazione):

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

SGLang è distribuito come Plugin fornitore incluso per server self-hosted veloci compatibili con OpenAI:

- Fornitore: `sglang`
- Autenticazione: facoltativa (dipende dal tuo server)
- URL di base predefinito: `http://127.0.0.1:30000/v1`

Per abilitare esplicitamente la discovery automatica locale (qualsiasi valore va bene se il tuo server non applica l'autenticazione):

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
    Per i fornitori personalizzati, `reasoning`, `input`, `cost`, `contextWindow` e `maxTokens` sono facoltativi. Quando omessi, OpenClaw usa come predefiniti:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Consigliato: imposta valori espliciti che corrispondano ai limiti del tuo proxy/modello.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Per `api: "openai-completions"` su endpoint non nativi (qualsiasi `baseUrl` non vuoto il cui host non sia `api.openai.com`), OpenClaw forza `compat.supportsDeveloperRole: false` per evitare errori 400 del fornitore per ruoli `developer` non supportati.
    - Le route compatibili con OpenAI in stile proxy saltano anche lo shaping delle richieste nativo e solo OpenAI: niente `service_tier`, niente `store` per Responses, niente `store` per Completions, niente suggerimenti per prompt-cache, niente shaping del payload di compatibilità con il ragionamento OpenAI e niente header nascosti di attribuzione OpenClaw.
    - Per proxy Completions compatibili con OpenAI che richiedono campi specifici del fornitore, imposta `agents.defaults.models["provider/model"].params.extra_body` (o `extraBody`) per unire JSON aggiuntivo nel corpo della richiesta in uscita.
    - Per i controlli chat-template di vLLM, imposta `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Il Plugin vLLM incluso invia automaticamente `enable_thinking: false` e `force_nonempty_content: true` per `vllm/nemotron-3-*` quando il livello di ragionamento della sessione è disattivato.
    - Per modelli locali lenti o host LAN/tailnet remoti, imposta `models.providers.<id>.timeoutSeconds`. Questo estende la gestione delle richieste HTTP del modello del fornitore, inclusi connessione, header, streaming del corpo e abort totale del guarded-fetch, senza aumentare il timeout dell'intero runtime dell'agente.
    - Le chiamate HTTP del fornitore del modello consentono risposte DNS fake-IP di Surge, Clash e sing-box in `198.18.0.0/15` e `fc00::/7` solo per l'hostname `baseUrl` del fornitore configurato. Altre destinazioni private, loopback, link-local e metadata richiedono comunque un opt-in esplicito `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Se `baseUrl` è vuoto/omesso, OpenClaw mantiene il comportamento predefinito di OpenAI (che risolve in `api.openai.com`).
    - Per sicurezza, un `compat.supportsDeveloperRole: true` esplicito viene comunque sovrascritto su endpoint `openai-completions` non nativi.
    - Per `api: "anthropic-messages"` su endpoint non diretti (qualsiasi fornitore diverso dal `anthropic` canonico, o un `models.providers.anthropic.baseUrl` personalizzato il cui host non sia un endpoint pubblico `api.anthropic.com`), OpenClaw sopprime gli header beta Anthropic impliciti come `claude-code-20250219`, `interleaved-thinking-2025-05-14` e i marker OAuth, così i proxy personalizzati compatibili con Anthropic non rifiutano flag beta non supportati. Imposta esplicitamente `models.providers.<id>.headers["anthropic-beta"]` se il tuo proxy richiede funzionalità beta specifiche.

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
- [Modelli](/it/concepts/models) - configurazione dei modelli e alias
- [Fornitori](/it/providers) - guide di configurazione per fornitore
