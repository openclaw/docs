---
read_when:
    - Anda ingin menggunakan Kimi untuk web_search
    - Anda memerlukan `KIMI_API_KEY` atau `MOONSHOT_API_KEY`
summary: Pencarian web Kimi melalui pencarian web Moonshot
title: Kimi Search
x-i18n:
    generated_at: "2026-04-05T14:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753757a5497a683c35b4509ed3709b9514dc14a45612675d0f729ae6668c82a5
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi Search

OpenClaw mendukung Kimi sebagai penyedia `web_search`, menggunakan pencarian web Moonshot
untuk menghasilkan jawaban hasil sintesis AI dengan sitasi.

## Dapatkan API key

<Steps>
  <Step title="Buat kunci">
    Dapatkan API key dari [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Simpan kunci">
    Atur `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di environment Gateway, atau
    konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Saat Anda memilih **Kimi** selama `openclaw onboard` atau
`openclaw configure --section web`, OpenClaw juga dapat meminta:

- region API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- model web-search Kimi default (default ke `kimi-k2.5`)

## Config

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opsional jika KIMI_API_KEY atau MOONSHOT_API_KEY diatur
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

Jika Anda menggunakan host API China untuk chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw menggunakan kembali host yang sama untuk Kimi
`web_search` saat `tools.web.search.kimi.baseUrl` dihilangkan, sehingga key dari
[platform.moonshot.cn](https://platform.moonshot.cn/) tidak mengenai
endpoint internasional secara keliru (yang sering mengembalikan HTTP 401). Override
dengan `tools.web.search.kimi.baseUrl` saat Anda memerlukan URL dasar pencarian yang berbeda.

**Alternatif environment:** atur `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di
environment Gateway. Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

Jika Anda menghilangkan `baseUrl`, OpenClaw default ke `https://api.moonshot.ai/v1`.
Jika Anda menghilangkan `model`, OpenClaw default ke `kimi-k2.5`.

## Cara kerjanya

Kimi menggunakan pencarian web Moonshot untuk mensintesis jawaban dengan sitasi inline,
mirip dengan pendekatan respons ber-grounding milik Gemini dan Grok.

## Parameter yang didukung

Pencarian Kimi mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Kimi tetap
mengembalikan satu jawaban hasil sintesis dengan sitasi alih-alih daftar N hasil.

Filter khusus penyedia saat ini tidak didukung.

## Terkait

- [Ringkasan Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [Moonshot AI](/id/providers/moonshot) -- dokumentasi penyedia model Moonshot + Kimi Coding
- [Gemini Search](/tools/gemini-search) -- jawaban hasil sintesis AI melalui grounding Google
- [Grok Search](/tools/grok-search) -- jawaban hasil sintesis AI melalui grounding xAI
