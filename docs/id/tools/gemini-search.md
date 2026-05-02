---
read_when:
    - Anda ingin menggunakan Gemini untuk web_search
    - Anda memerlukan GEMINI_API_KEY atau models.providers.google.apiKey
    - Anda menginginkan pembumian Google Search
summary: Pencarian web Gemini dengan pengandasan Google Search
title: Pencarian Gemini
x-i18n:
    generated_at: "2026-05-02T09:34:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw mendukung model Gemini dengan
[grounding Google Search](https://ai.google.dev/gemini-api/docs/grounding) bawaan,
yang mengembalikan jawaban yang disintesis AI dan didukung oleh hasil Google Search langsung dengan
sitasi.

## Dapatkan kunci API

<Steps>
  <Step title="Create a key">
    Buka [Google AI Studio](https://aistudio.google.com/apikey) dan buat
    kunci API.
  </Step>
  <Step title="Store the key">
    Atur `GEMINI_API_KEY` di lingkungan Gateway, gunakan ulang
    `models.providers.google.apiKey`, atau konfigurasikan kunci pencarian web khusus melalui:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
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

**Prioritas kredensial:** Pencarian web Gemini menggunakan
`plugins.entries.google.config.webSearch.apiKey` terlebih dahulu, lalu `GEMINI_API_KEY`,
lalu `models.providers.google.apiKey`. Untuk URL dasar, nilai khusus
`plugins.entries.google.config.webSearch.baseUrl` diutamakan sebelum
`models.providers.google.baseUrl`.

Untuk instalasi Gateway, letakkan kunci env di `~/.openclaw/.env`.

## Cara kerjanya

Tidak seperti penyedia pencarian tradisional yang mengembalikan daftar tautan dan cuplikan,
Gemini menggunakan grounding Google Search untuk menghasilkan jawaban yang disintesis AI dengan
sitasi inline. Hasilnya mencakup jawaban yang disintesis dan URL sumber.

- URL sitasi dari grounding Gemini secara otomatis diselesaikan dari URL pengalihan Google
  menjadi URL langsung.
- Penyelesaian pengalihan menggunakan jalur pelindung SSRF (HEAD + pemeriksaan pengalihan +
  validasi http/https) sebelum mengembalikan URL sitasi final.
- Penyelesaian pengalihan menggunakan default SSRF yang ketat, sehingga pengalihan ke
  target privat/internal diblokir.

## Parameter yang didukung

Pencarian Gemini mendukung `query`, `freshness`, `date_after`, dan `date_before`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi grounding Gemini
tetap mengembalikan satu jawaban yang disintesis dengan sitasi, bukan daftar
N hasil.

`freshness` menerima `day`, `week`, `month`, `year`, dan pintasan bersama
`pd`, `pw`, `pm`, dan `py`. OpenClaw mengonversi nilai-nilai ini, atau rentang eksplisit
`date_after`/`date_before`, menjadi `timeRangeFilter` milik grounding Google Search Gemini.
`country`, `language`, dan `domain_filter` tidak didukung.

## Pemilihan model

Model default adalah `gemini-2.5-flash` (cepat dan hemat biaya). Model Gemini apa pun
yang mendukung grounding dapat digunakan melalui
`plugins.entries.google.config.webSearch.model`.

## Override URL dasar

Atur `plugins.entries.google.config.webSearch.baseUrl` ketika pencarian web Gemini
harus dirutekan melalui proksi operator atau endpoint kustom yang kompatibel dengan Gemini. Jika
itu tidak diatur, pencarian web Gemini menggunakan ulang `models.providers.google.baseUrl`. Nilai biasa
`https://generativelanguage.googleapis.com` dinormalisasi menjadi
`https://generativelanguage.googleapis.com/v1beta`; jalur proksi kustom dipertahankan
sebagaimana diberikan setelah memangkas garis miring penutup.

## Terkait

- [Ringkasan Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan cuplikan
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur + ekstraksi konten
