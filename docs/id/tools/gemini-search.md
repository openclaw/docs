---
read_when:
    - Anda ingin menggunakan Gemini untuk web_search
    - Anda memerlukan `GEMINI_API_KEY`
    - Anda menginginkan grounding Google Search
summary: Gemini web search dengan grounding Google Search
title: Pencarian Gemini
x-i18n:
    generated_at: "2026-04-24T09:31:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClaw mendukung model Gemini dengan
[grounding Google Search](https://ai.google.dev/gemini-api/docs/grounding) bawaan,
yang mengembalikan jawaban tersintesis AI yang didukung oleh hasil Google Search live dengan
sitasi.

## Dapatkan API key

<Steps>
  <Step title="Buat key">
    Buka [Google AI Studio](https://aistudio.google.com/apikey) dan buat
    API key.
  </Step>
  <Step title="Simpan key">
    Setel `GEMINI_API_KEY` di lingkungan Gateway, atau konfigurasikan melalui:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfigurasi

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opsional jika GEMINI_API_KEY disetel
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

**Alternatif lingkungan:** setel `GEMINI_API_KEY` di lingkungan Gateway.
Untuk instalasi Gateway, letakkan di `~/.openclaw/.env`.

## Cara kerjanya

Tidak seperti provider pencarian tradisional yang mengembalikan daftar tautan dan cuplikan,
Gemini menggunakan grounding Google Search untuk menghasilkan jawaban tersintesis AI dengan
sitasi inline. Hasilnya mencakup jawaban tersintesis dan URL sumber.

- URL sitasi dari grounding Gemini otomatis di-resolve dari URL redirect Google
  menjadi URL langsung.
- Resolusi redirect menggunakan jalur guard SSRF (HEAD + pemeriksaan redirect +
  validasi http/https) sebelum mengembalikan URL sitasi final.
- Resolusi redirect menggunakan default SSRF yang ketat, sehingga redirect ke
  target privat/internal diblokir.

## Parameter yang didukung

Pencarian Gemini mendukung `query`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi grounding Gemini
tetap mengembalikan satu jawaban tersintesis dengan sitasi alih-alih daftar
hasil N.

Filter khusus provider seperti `country`, `language`, `freshness`, dan
`domain_filter` tidak didukung.

## Pemilihan model

Model default adalah `gemini-2.5-flash` (cepat dan hemat biaya). Model Gemini apa pun
yang mendukung grounding dapat digunakan melalui
`plugins.entries.google.config.webSearch.model`.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan cuplikan
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur + ekstraksi konten
