---
read_when:
    - Anda ingin menggunakan Gemini untuk web_search
    - Anda membutuhkan `GEMINI_API_KEY`
    - Anda ingin grounding Google Search
summary: Pencarian web Gemini dengan grounding Google Search
title: Gemini Search
x-i18n:
    generated_at: "2026-04-05T14:08:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini Search

OpenClaw mendukung model Gemini dengan
[grounding Google Search](https://ai.google.dev/gemini-api/docs/grounding) bawaan,
yang mengembalikan jawaban hasil sintesis AI yang didukung hasil Google Search langsung dengan
sitasi.

## Dapatkan API key

<Steps>
  <Step title="Buat kunci">
    Buka [Google AI Studio](https://aistudio.google.com/apikey) dan buat
    API key.
  </Step>
  <Step title="Simpan kunci">
    Atur `GEMINI_API_KEY` di environment Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opsional jika GEMINI_API_KEY diatur
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Alternatif environment:** atur `GEMINI_API_KEY` di environment Gateway.
Untuk instalasi gateway, letakkan di `~/.openclaw/.env`.

## Cara kerjanya

Tidak seperti penyedia pencarian tradisional yang mengembalikan daftar tautan dan cuplikan,
Gemini menggunakan grounding Google Search untuk menghasilkan jawaban hasil sintesis AI dengan
sitasi inline. Hasilnya mencakup jawaban hasil sintesis dan URL
sumber.

- URL sitasi dari grounding Gemini secara otomatis di-resolve dari URL redirect Google
  menjadi URL langsung.
- Resolusi redirect menggunakan path pelindung SSRF (pemeriksaan HEAD + redirect +
  validasi http/https) sebelum mengembalikan URL sitasi final.
- Resolusi redirect menggunakan default SSRF yang ketat, sehingga redirect ke
  target privat/internal diblokir.

## Parameter yang didukung

Pencarian Gemini mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi grounding Gemini
tetap mengembalikan satu jawaban hasil sintesis dengan sitasi alih-alih daftar
N hasil.

Filter khusus penyedia seperti `country`, `language`, `freshness`, dan
`domain_filter` tidak didukung.

## Pemilihan model

Model default adalah `gemini-2.5-flash` (cepat dan hemat biaya). Model Gemini apa pun
yang mendukung grounding dapat digunakan melalui
`plugins.entries.google.config.webSearch.model`.

## Terkait

- [Ringkasan Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/tools/brave-search) -- hasil terstruktur dengan cuplikan
- [Perplexity Search](/tools/perplexity-search) -- hasil terstruktur + ekstraksi konten
