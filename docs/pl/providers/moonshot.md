---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform) lub Kimi Coding
    - Musisz zrozumieć oddzielne endpointy, klucze i referencje modeli
    - Chcesz mieć gotową do skopiowania konfigurację dla jednego z dostawców
summary: Skonfiguruj Moonshot K2 i Kimi Coding (oddzielni dostawcy + klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T14:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot udostępnia API Kimi z endpointami zgodnymi z OpenAI. Skonfiguruj
dostawcę i ustaw model domyślny na `moonshot/kimi-k2.5`, albo użyj
Kimi Coding z `kimi/kimi-code`.

Aktualne identyfikatory modeli Kimi K2:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# lub
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Uwaga: Moonshot i Kimi Coding to oddzielni dostawcy. Klucze nie są zamienne, endpointy są różne, a referencje modeli się różnią (Moonshot używa `moonshot/...`, Kimi Coding używa `kimi/...`).

Wyszukiwanie w sieci Kimi również używa wtyczki Moonshot:

```bash
openclaw configure --section web
```

W sekcji wyszukiwania w sieci wybierz **Kimi**, aby zapisać
`plugins.entries.moonshot.config.webSearch.*`.

## Fragment konfiguracji (API Moonshot)

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

## Wyszukiwanie w sieci Kimi

OpenClaw dostarcza też **Kimi** jako dostawcę `web_search`, opartego na wyszukiwaniu w sieci Moonshot.

Konfiguracja interaktywna może pytać o:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- domyślny model wyszukiwania w sieci Kimi (domyślnie `kimi-k2.5`)

Konfiguracja znajduje się pod `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // lub użyj KIMI_API_KEY / MOONSHOT_API_KEY
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

## Uwagi

- Referencje modeli Moonshot używają `moonshot/<modelId>`. Referencje modeli Kimi Coding używają `kimi/<modelId>`.
- Aktualna domyślna referencja modelu Kimi Coding to `kimi/kimi-code`. Starsze `kimi/k2p5` nadal jest akceptowane jako zgodny identyfikator modelu.
- Wyszukiwanie w sieci Kimi używa `KIMI_API_KEY` lub `MOONSHOT_API_KEY` i domyślnie korzysta z `https://api.moonshot.ai/v1` z modelem `kimi-k2.5`.
- Natywne endpointy Moonshot (`https://api.moonshot.ai/v1` i
  `https://api.moonshot.cn/v1`) deklarują zgodność użycia strumieniowego we
  współdzielonym transporcie `openai-completions`. OpenClaw opiera to teraz na możliwościach endpointu,
  więc zgodne niestandardowe identyfikatory dostawców kierujące na te same natywne
  hosty Moonshot dziedziczą to samo zachowanie użycia strumieniowego.
- W razie potrzeby nadpisz ceny i metadane kontekstu w `models.providers`.
- Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj
  `contextWindow`.
- Używaj `https://api.moonshot.ai/v1` dla endpointu międzynarodowego oraz `https://api.moonshot.cn/v1` dla endpointu w Chinach.
- Opcje onboardingu:
  - `moonshot-api-key` dla `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` dla `https://api.moonshot.cn/v1`

## Natywny tryb myślenia (Moonshot)

Moonshot Kimi obsługuje binarny natywny tryb myślenia:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Skonfiguruj go dla modelu w `agents.defaults.models.<provider/model>.params`:

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

OpenClaw mapuje też poziomy `/think` w runtime dla Moonshot:

- `/think off` -> `thinking.type=disabled`
- dowolny poziom myślenia inny niż off -> `thinking.type=enabled`

Gdy tryb myślenia Moonshot jest włączony, `tool_choice` musi mieć wartość `auto` lub `none`. OpenClaw normalizuje niezgodne wartości `tool_choice` do `auto` dla zachowania zgodności.
