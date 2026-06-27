---
read_when:
    - Anda ingin menggunakan Gemini untuk web_search
    - Anda memerlukan GEMINI_API_KEY atau models.providers.google.apiKey
    - Anda menginginkan pelandasan dengan Google Search
summary: Pencarian web Gemini dengan grounding Google Search
title: Pencarian Gemini
x-i18n:
    generated_at: "2026-06-27T18:18:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw mendukung model Gemini dengan
[pembumian Google Search](https://ai.google.dev/gemini-api/docs/grounding)
bawaan, yang mengembalikan jawaban yang disintesis AI dan didukung oleh hasil
Google Search langsung dengan sitasi.

## Dapatkan kunci API

<Steps>
  <Step title="Create a key">
    Buka [Google AI Studio](https://aistudio.google.com/apikey) dan buat
    kunci API.
  </Step>
  <Step title="Store the key">
    Atur `GEMINI_API_KEY` di lingkungan Gateway, gunakan kembali
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
lalu `models.providers.google.apiKey`. Untuk URL dasar,
`plugins.entries.google.config.webSearch.baseUrl` khusus diutamakan sebelum
`models.providers.google.baseUrl`.

Untuk instalasi gateway, letakkan kunci env di `~/.openclaw/.env`.

## Cara kerjanya

Berbeda dari penyedia pencarian tradisional yang mengembalikan daftar tautan dan cuplikan,
Gemini menggunakan pembumian Google Search untuk menghasilkan jawaban yang disintesis AI dengan
sitasi sebaris. Hasilnya mencakup jawaban yang disintesis dan URL sumber.

- URL sitasi dari pembumian Gemini secara otomatis diresolusikan dari URL
  pengalihan Google menjadi URL langsung.
- Resolusi pengalihan menggunakan jalur pengaman SSRF (HEAD + pemeriksaan pengalihan +
  validasi http/https) sebelum mengembalikan URL sitasi akhir.
- Resolusi pengalihan menggunakan default SSRF yang ketat, sehingga pengalihan ke
  target privat/internal diblokir.

## Parameter yang didukung

Pencarian Gemini mendukung `query`, `freshness`, `date_after`, dan `date_before`.

`count` diterima untuk kompatibilitas bersama `web_search`, tetapi pembumian Gemini
tetap mengembalikan satu jawaban yang disintesis dengan sitasi, bukan daftar dengan
N hasil.

`freshness` menerima `day`, `week`, `month`, `year`, dan pintasan bersama
`pd`, `pw`, `pm`, dan `py`. `day`/`pd` menambahkan instruksi keterbaruan ke kueri Gemini,
bukan rentang 24 jam yang kaku. `week`, `month`, `year`, dan rentang eksplisit
`date_after`/`date_before` mengatur `timeRangeFilter` pembumian Google Search Gemini.
`country`, `language`, dan `domain_filter` tidak didukung.

## Pemilihan model

Model default adalah `gemini-2.5-flash` (cepat dan hemat biaya). Model Gemini apa pun
yang mendukung pembumian dapat digunakan melalui
`plugins.entries.google.config.webSearch.model`.

## Penggantian URL dasar

Atur `plugins.entries.google.config.webSearch.baseUrl` ketika pencarian web Gemini
harus dirutekan melalui proksi operator atau endpoint kustom yang kompatibel dengan Gemini. Jika
tidak diatur, pencarian web Gemini menggunakan kembali `models.providers.google.baseUrl`. Nilai biasa
`https://generativelanguage.googleapis.com` dinormalisasi menjadi
`https://generativelanguage.googleapis.com/v1beta`; jalur proksi kustom dipertahankan
sebagaimana diberikan setelah memangkas garis miring penutup.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan cuplikan
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur + ekstraksi konten
