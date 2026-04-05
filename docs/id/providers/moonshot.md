---
read_when:
    - Anda ingin penyiapan Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Anda perlu memahami endpoint, key, dan referensi model yang terpisah
    - Anda ingin config siap salin-tempel untuk salah satu provider
summary: Konfigurasikan Moonshot K2 vs Kimi Coding (provider + key terpisah)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T14:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot menyediakan API Kimi dengan endpoint yang kompatibel dengan OpenAI. Konfigurasikan
provider lalu set model default ke `moonshot/kimi-k2.5`, atau gunakan
Kimi Coding dengan `kimi/kimi-code`.

ID model Kimi K2 saat ini:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# atau
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Catatan: Moonshot dan Kimi Coding adalah provider yang terpisah. Key tidak saling dapat dipertukarkan, endpoint berbeda, dan referensi model berbeda (Moonshot menggunakan `moonshot/...`, Kimi Coding menggunakan `kimi/...`).

Pencarian web Kimi juga menggunakan plugin Moonshot:

```bash
openclaw configure --section web
```

Pilih **Kimi** di bagian web-search untuk menyimpan
`plugins.entries.moonshot.config.webSearch.*`.

## Snippet config (Moonshot API)

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

## Pencarian web Kimi

OpenClaw juga menyertakan **Kimi** sebagai provider `web_search`, didukung oleh pencarian web Moonshot.

Penyiapan interaktif dapat meminta:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- model default web-search Kimi (default ke `kimi-k2.5`)

Config berada di bawah `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // atau gunakan KIMI_API_KEY / MOONSHOT_API_KEY
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

## Catatan

- Referensi model Moonshot menggunakan `moonshot/<modelId>`. Referensi model Kimi Coding menggunakan `kimi/<modelId>`.
- Referensi model default Kimi Coding saat ini adalah `kimi/kimi-code`. `kimi/k2p5` legacy tetap diterima sebagai id model kompatibilitas.
- Pencarian web Kimi menggunakan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`, dan default ke `https://api.moonshot.ai/v1` dengan model `kimi-k2.5`.
- Endpoint Moonshot native (`https://api.moonshot.ai/v1` dan
  `https://api.moonshot.cn/v1`) mengiklankan kompatibilitas penggunaan streaming pada
  transport bersama `openai-completions`. OpenClaw kini mengaitkan itu ke
  kapabilitas endpoint, sehingga id provider kustom yang kompatibel yang menargetkan host
  Moonshot native yang sama mewarisi perilaku streaming-usage yang sama.
- Timpa metadata harga dan konteks di `models.providers` bila diperlukan.
- Jika Moonshot memublikasikan batas konteks yang berbeda untuk suatu model, sesuaikan
  `contextWindow` sebagaimana mestinya.
- Gunakan `https://api.moonshot.ai/v1` untuk endpoint internasional, dan `https://api.moonshot.cn/v1` untuk endpoint Tiongkok.
- Pilihan onboarding:
  - `moonshot-api-key` untuk `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` untuk `https://api.moonshot.cn/v1`

## Native thinking mode (Moonshot)

Moonshot Kimi mendukung native thinking biner:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Konfigurasikan per model melalui `agents.defaults.models.<provider/model>.params`:

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

OpenClaw juga memetakan level runtime `/think` untuk Moonshot:

- `/think off` -> `thinking.type=disabled`
- level thinking apa pun selain off -> `thinking.type=enabled`

Saat Moonshot thinking diaktifkan, `tool_choice` harus `auto` atau `none`. OpenClaw menormalkan nilai `tool_choice` yang tidak kompatibel ke `auto` untuk kompatibilitas.
