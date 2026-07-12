---
read_when:
    - Anda ingin menggunakan Gemini untuk web_search
    - Anda memerlukan GEMINI_API_KEY atau models.providers.google.apiKey
    - Anda ingin grounding Google Search
summary: Pencarian web Gemini dengan grounding Google Search
title: Pencarian Gemini
x-i18n:
    generated_at: "2026-07-12T14:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw mendukung model Gemini dengan
[grounding Google Search](https://ai.google.dev/gemini-api/docs/grounding)
bawaan, yang menghasilkan jawaban yang disintesis oleh AI berdasarkan hasil
Google Search langsung beserta kutipan.

## Dapatkan kunci API

<Steps>
  <Step title="Buat kunci">
    Buka [Google AI Studio](https://aistudio.google.com/apikey) dan buat
    kunci API.
  </Step>
  <Step title="Simpan kunci">
    Tetapkan `GEMINI_API_KEY` di lingkungan Gateway, gunakan kembali
    `models.providers.google.apiKey`, atau konfigurasikan kunci khusus pencarian web melalui:

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
            apiKey: "AIza...", // opsional jika GEMINI_API_KEY atau models.providers.google.apiKey ditetapkan
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // opsional; beralih ke models.providers.google.baseUrl jika tidak tersedia
            model: "gemini-2.5-flash", // bawaan
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

**Urutan prioritas kredensial:** Pencarian web Gemini menggunakan
`plugins.entries.google.config.webSearch.apiKey` terlebih dahulu, lalu `GEMINI_API_KEY`,
kemudian `models.providers.google.apiKey`. Untuk URL dasar,
`plugins.entries.google.config.webSearch.baseUrl` khusus diprioritaskan sebelum
`models.providers.google.baseUrl`.

Untuk instalasi Gateway, letakkan kunci lingkungan di `~/.openclaw/.env`.

## Cara kerjanya

Tidak seperti penyedia pencarian tradisional yang mengembalikan daftar tautan dan cuplikan,
Gemini menggunakan grounding Google Search untuk menghasilkan jawaban yang disintesis oleh AI
dengan kutipan sebaris. Hasilnya mencakup jawaban yang disintesis dan URL
sumber.

- URL kutipan dari grounding Gemini secara otomatis diubah dari URL pengalihan
  Google menjadi URL langsung melalui permintaan HEAD lewat jalur pengambilan OpenClaw
  yang dilindungi dari SSRF (mengikuti pengalihan, validasi http/https).
- Resolusi pengalihan menggunakan pengaturan bawaan SSRF yang ketat, sehingga pengalihan ke
  target privat/internal diblokir.

## Parameter yang didukung

Pencarian Gemini mendukung `query`, `freshness`, `date_after`, dan `date_before`.

`count` diterima untuk kompatibilitas `web_search` bersama, tetapi grounding Gemini
tetap mengembalikan satu jawaban yang disintesis dengan kutipan, bukan daftar
berisi N hasil.

`freshness` menerima `day`, `week`, `month`, `year`, serta pintasan bersama
`pd`, `pw`, `pm`, dan `py`. `day`/`pd` menambahkan instruksi keterkinian ke kueri Gemini,
bukan rentang 24 jam yang ketat. `week`, `month`, `year`, serta rentang eksplisit
`date_after`/`date_before` menetapkan `timeRangeFilter` pada grounding
Google Search Gemini. `country`, `language`, dan `domain_filter` tidak didukung.

## Pemilihan model

Model bawaan adalah `gemini-2.5-flash` (cepat dan hemat biaya). Model Gemini
apa pun yang mendukung grounding dapat digunakan melalui
`plugins.entries.google.config.webSearch.model`.

## Penggantian URL dasar

Tetapkan `plugins.entries.google.config.webSearch.baseUrl` ketika pencarian web Gemini
harus dirutekan melalui proksi operator atau titik akhir khusus yang kompatibel dengan Gemini. Jika
tidak ditetapkan, pencarian web Gemini menggunakan kembali `models.providers.google.baseUrl`. Nilai
`https://generativelanguage.googleapis.com` biasa dinormalisasi menjadi
`https://generativelanguage.googleapis.com/v1beta`; jalur proksi khusus dipertahankan
sebagaimana diberikan setelah garis miring di akhir dihapus.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan cuplikan
- [Perplexity Search](/id/tools/perplexity-search) -- hasil terstruktur + ekstraksi konten
