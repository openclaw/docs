---
read_when:
    - Anda ingin menggunakan Kimi untuk web_search
    - Anda memerlukan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`
summary: Pencarian web Kimi melalui pencarian web Moonshot
title: Kimi search
x-i18n:
    generated_at: "2026-04-24T09:31:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw mendukung Kimi sebagai provider `web_search`, menggunakan pencarian web Moonshot
untuk menghasilkan jawaban yang disintesis AI dengan sitasi.

## Dapatkan API key

<Steps>
  <Step title="Buat key">
    Dapatkan API key dari [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Simpan key">
    Setel `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di lingkungan Gateway, atau
    konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Ketika Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat menanyakan:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- model default web-search Kimi (default `kimi-k2.6`)

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opsional jika KIMI_API_KEY atau MOONSHOT_API_KEY diatur
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

Jika Anda menggunakan host API China untuk chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw menggunakan ulang host yang sama itu untuk Kimi
`web_search` ketika `tools.web.search.kimi.baseUrl` dihilangkan, sehingga key dari
[platform.moonshot.cn](https://platform.moonshot.cn/) tidak salah mengenai
endpoint internasional (yang sering mengembalikan HTTP 401). Override dengan
`tools.web.search.kimi.baseUrl` ketika Anda memerlukan base URL pencarian yang berbeda.

**Alternatif environment:** setel `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di
lingkungan Gateway. Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

Jika Anda menghilangkan `baseUrl`, OpenClaw default ke `https://api.moonshot.ai/v1`.
Jika Anda menghilangkan `model`, OpenClaw default ke `kimi-k2.6`.

## Cara kerjanya

Kimi menggunakan pencarian web Moonshot untuk mensintesis jawaban dengan sitasi inline,
mirip dengan pendekatan respons grounded milik Gemini dan Grok.

## Parameter yang didukung

Pencarian Kimi mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Kimi tetap
mengembalikan satu jawaban sintetis dengan sitasi, bukan daftar hasil sebanyak N.

Filter spesifik provider saat ini belum didukung.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan auto-detection
- [Moonshot AI](/id/providers/moonshot) -- dokumentasi provider model Moonshot + Kimi Coding
- [Gemini Search](/id/tools/gemini-search) -- jawaban sintetis AI melalui grounding Google
- [Grok Search](/id/tools/grok-search) -- jawaban sintetis AI melalui grounding xAI
