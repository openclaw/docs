---
read_when:
    - Anda ingin menggunakan Kimi untuk web_search
    - Anda memerlukan KIMI_API_KEY atau MOONSHOT_API_KEY
summary: Pencarian web Kimi melalui pencarian web Moonshot
title: Pencarian Kimi
x-i18n:
    generated_at: "2026-05-02T09:34:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw mendukung Kimi sebagai penyedia `web_search`, menggunakan pencarian web Moonshot
untuk menghasilkan jawaban yang disintesis AI dengan sitasi.

## Dapatkan kunci API

<Steps>
  <Step title="Buat kunci">
    Dapatkan kunci API dari [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Simpan kunci">
    Atur `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di lingkungan Gateway, atau
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
- model pencarian web Kimi bawaan (default ke `kimi-k2.6`)

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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
`https://api.moonshot.cn/v1`), OpenClaw menggunakan ulang host yang sama untuk
`web_search` Kimi saat `tools.web.search.kimi.baseUrl` dihilangkan, sehingga kunci dari
[platform.moonshot.cn](https://platform.moonshot.cn/) tidak mengenai endpoint
internasional secara keliru (yang sering mengembalikan HTTP 401). Timpa
dengan `tools.web.search.kimi.baseUrl` saat Anda memerlukan URL dasar pencarian yang berbeda.

**Alternatif lingkungan:** atur `KIMI_API_KEY` atau `MOONSHOT_API_KEY` di
lingkungan Gateway. Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

Jika Anda menghilangkan `baseUrl`, OpenClaw default ke `https://api.moonshot.ai/v1`.
Jika Anda menghilangkan `model`, OpenClaw default ke `kimi-k2.6`.

## Cara kerjanya

Kimi menggunakan pencarian web Moonshot untuk menyintesis jawaban dengan sitasi inline,
mirip dengan pendekatan respons berlandasan Gemini dan Grok.

OpenClaw menganggap `web_search` Kimi berhasil hanya setelah Moonshot mengembalikan
bukti grounding pencarian web native, seperti payload alat `$web_search` yang dapat
diputar ulang, `search_results`, atau URL sitasi. Jika Kimi langsung berhenti dengan
jawaban chat biasa seperti "I cannot browse the internet" dan tanpa bukti grounding,
OpenClaw mengembalikan error terstruktur `kimi_web_search_ungrounded` alih-alih
membungkus teks tersebut sebagai hasil pencarian. Coba ulang kueri, beralih ke
penyedia terstruktur seperti Brave, atau gunakan `web_fetch` / alat browser saat Anda sudah
memiliki URL target.

## Parameter yang didukung

Pencarian Kimi mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi Kimi tetap
mengembalikan satu jawaban yang disintesis dengan sitasi, bukan daftar N hasil.

Filter khusus penyedia saat ini tidak didukung.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Moonshot AI](/id/providers/moonshot) -- model Moonshot + dokumentasi penyedia Kimi Coding
- [Pencarian Gemini](/id/tools/gemini-search) -- jawaban yang disintesis AI melalui grounding Google
- [Pencarian Grok](/id/tools/grok-search) -- jawaban yang disintesis AI melalui grounding xAI
