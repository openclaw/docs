---
read_when:
    - Moonshot K2 (Moonshot Open Platform) ile Kimi Coding kurulumunu istiyorsunuz
    - Ayrı endpoint'leri, anahtarları ve model ref'lerini anlamanız gerekiyor
    - Her iki sağlayıcı için de kopyala/yapıştır config istiyorsunuz
summary: Moonshot K2 ile Kimi Coding'i yapılandırın (ayrı sağlayıcılar + anahtarlar)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T14:04:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot, OpenAI uyumlu endpoint'lerle Kimi API'sini sunar. Sağlayıcıyı yapılandırın
ve varsayılan modeli `moonshot/kimi-k2.5` olarak ayarlayın veya
`kimi/kimi-code` ile Kimi Coding kullanın.

Geçerli Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# veya
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Not: Moonshot ve Kimi Coding ayrı sağlayıcılardır. Anahtarlar birbirinin yerine kullanılamaz, endpoint'ler farklıdır ve model ref'leri farklıdır (Moonshot `moonshot/...`, Kimi Coding ise `kimi/...` kullanır).

Kimi web search de Moonshot eklentisini kullanır:

```bash
openclaw configure --section web
```

Web-search bölümünde **Kimi** seçeneğini seçerek
`plugins.entries.moonshot.config.webSearch.*` değerlerini saklayın.

## Config parçacığı (Moonshot API)

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

## Kimi web search

OpenClaw ayrıca Moonshot web
search tarafından desteklenen bir `web_search` sağlayıcısı olarak **Kimi** sunar.

Etkileşimli kurulum sırasında şunlar sorulabilir:

- Moonshot API bölgesi:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- varsayılan Kimi web-search modeli (varsayılan `kimi-k2.5`)

Config, `plugins.entries.moonshot.config.webSearch` altında bulunur:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // veya KIMI_API_KEY / MOONSHOT_API_KEY kullanın
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

## Notlar

- Moonshot model ref'leri `moonshot/<modelId>` kullanır. Kimi Coding model ref'leri `kimi/<modelId>` kullanır.
- Geçerli varsayılan Kimi Coding model ref'i `kimi/kimi-code` değeridir. Eski `kimi/k2p5` uyumluluk için model kimliği olarak kabul edilmeye devam eder.
- Kimi web search, `KIMI_API_KEY` veya `MOONSHOT_API_KEY` kullanır ve varsayılan olarak `https://api.moonshot.ai/v1` ile `kimi-k2.5` modelini kullanır.
- Yerel Moonshot endpoint'leri (`https://api.moonshot.ai/v1` ve
  `https://api.moonshot.cn/v1`) paylaşılan
  `openai-completions` taşımada akış kullanım uyumluluğu sunduğunu belirtir. OpenClaw artık bunu endpoint
  yeteneklerine göre anahtarladığı için, aynı yerel
  Moonshot host'larını hedefleyen uyumlu özel sağlayıcı kimlikleri aynı akış kullanım davranışını devralır.
- Gerekirse `models.providers` içinde fiyatlandırma ve bağlam meta verilerini geçersiz kılın.
- Moonshot bir model için farklı bağlam sınırları yayımlarsa,
  `contextWindow` değerini buna göre ayarlayın.
- Uluslararası endpoint için `https://api.moonshot.ai/v1`, Çin endpoint'i için ise `https://api.moonshot.cn/v1` kullanın.
- Onboarding seçenekleri:
  - `https://api.moonshot.ai/v1` için `moonshot-api-key`
  - `https://api.moonshot.cn/v1` için `moonshot-api-key-cn`

## Yerel thinking modu (Moonshot)

Moonshot Kimi ikili yerel thinking desteği sunar:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Bunu model başına `agents.defaults.models.<provider/model>.params` üzerinden yapılandırın:

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

OpenClaw ayrıca Moonshot için çalışma zamanı `/think` seviyelerini eşler:

- `/think off` -> `thinking.type=disabled`
- off dışındaki herhangi bir thinking seviyesi -> `thinking.type=enabled`

Moonshot thinking etkin olduğunda `tool_choice` değeri `auto` veya `none` olmalıdır. OpenClaw, uyumluluk için uyumsuz `tool_choice` değerlerini `auto` olarak normalleştirir.
