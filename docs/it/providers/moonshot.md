---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) rispetto a Kimi Coding
    - Devi capire endpoint, chiavi e model ref separati
    - Vuoi una configurazione pronta da copiare e incollare per uno dei due provider
summary: Configura Moonshot K2 vs Kimi Coding (provider e chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T14:01:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.5`, oppure usa
Kimi Coding con `kimi/kimi-code`.

ID attuali dei modelli Kimi K2:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# oppure
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Nota: Moonshot e Kimi Coding sono provider separati. Le chiavi non sono intercambiabili, gli endpoint sono diversi e i model ref sono diversi (Moonshot usa `moonshot/...`, Kimi Coding usa `kimi/...`).

Anche la ricerca web Kimi usa il plugin Moonshot:

```bash
openclaw configure --section web
```

Scegli **Kimi** nella sezione web-search per memorizzare
`plugins.entries.moonshot.config.webSearch.*`.

## Snippet di configurazione (API Moonshot)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-turbo",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 16384,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: {
        "kimi/kimi-code": { alias: "Kimi" },
      },
    },
  },
}
```

## Ricerca web Kimi

OpenClaw include anche **Kimi** come provider `web_search`, supportato dalla ricerca web Moonshot.

La configurazione interattiva può richiedere:

- la regione API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- il modello predefinito di ricerca web Kimi (predefinito `kimi-k2.5`)

La configurazione si trova in `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oppure usa KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Note

- I model ref Moonshot usano `moonshot/<modelId>`. I model ref Kimi Coding usano `kimi/<modelId>`.
- L'attuale model ref predefinito di Kimi Coding è `kimi/kimi-code`. Il legacy `kimi/k2p5` resta accettato come id modello di compatibilità.
- La ricerca web Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e usa per impostazione predefinita `https://api.moonshot.ai/v1` con il modello `kimi-k2.5`.
- Gli endpoint Moonshot nativi (`https://api.moonshot.ai/v1` e
  `https://api.moonshot.cn/v1`) dichiarano compatibilità con l'utilizzo in streaming sul
  transport condiviso `openai-completions`. OpenClaw ora la determina in base alle capability dell'endpoint,
  quindi gli id provider personalizzati compatibili che puntano agli stessi host
  Moonshot nativi ereditano lo stesso comportamento di utilizzo in streaming.
- Sostituisci i metadati di prezzo e contesto in `models.providers` se necessario.
- Se Moonshot pubblica limiti di contesto diversi per un modello, regola
  `contextWindow` di conseguenza.
- Usa `https://api.moonshot.ai/v1` per l'endpoint internazionale e `https://api.moonshot.cn/v1` per l'endpoint Cina.
- Scelte disponibili nell'onboarding:
  - `moonshot-api-key` per `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` per `https://api.moonshot.cn/v1`

## Modalità thinking nativa (Moonshot)

Moonshot Kimi supporta il thinking nativo binario:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Configuralo per modello tramite `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw mappa anche i livelli runtime di `/think` per Moonshot:

- `/think off` -> `thinking.type=disabled`
- qualsiasi livello di thinking diverso da off -> `thinking.type=enabled`

Quando il thinking Moonshot è abilitato, `tool_choice` deve essere `auto` o `none`. OpenClaw normalizza i valori `tool_choice` incompatibili in `auto` per compatibilità.
