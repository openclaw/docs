---
read_when:
    - Anda ingin menggunakan Pencarian Perplexity untuk pencarian web
    - Anda memerlukan penyiapan `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
summary: API Pencarian Perplexity dan kompatibilitas Sonar/OpenRouter untuk `web_search`
title: Pencarian Perplexity (jalur lama)
x-i18n:
    generated_at: "2026-04-24T09:15:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# API Pencarian Perplexity

OpenClaw mendukung API Pencarian Perplexity sebagai provider `web_search`.
API ini mengembalikan hasil terstruktur dengan field `title`, `url`, dan `snippet`.

Untuk kompatibilitas, OpenClaw juga mendukung penyiapan lama Perplexity Sonar/OpenRouter.
Jika Anda menggunakan `OPENROUTER_API_KEY`, key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`, atau menyetel `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider beralih ke jalur chat-completions dan mengembalikan jawaban sintetis AI dengan sitasi alih-alih hasil API Pencarian terstruktur.

## Mendapatkan API key Perplexity

1. Buat akun Perplexity di [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Buat API key di dashboard
3. Simpan key di config atau setel `PERPLEXITY_API_KEY` di environment Gateway.

## Kompatibilitas OpenRouter

Jika Anda sudah menggunakan OpenRouter untuk Perplexity Sonar, pertahankan `provider: "perplexity"` dan setel `OPENROUTER_API_KEY` di environment Gateway, atau simpan key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`.

Kontrol kompatibilitas opsional:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Contoh konfigurasi

### API Pencarian Perplexity native

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Kompatibilitas OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Tempat menyetel key

**Melalui config:** jalankan `openclaw configure --section web`. Perintah ini menyimpan key di
`~/.openclaw/openclaw.json` di bawah `plugins.entries.perplexity.config.webSearch.apiKey`.
Field tersebut juga menerima objek SecretRef.

**Melalui environment:** setel `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
di environment proses Gateway. Untuk instalasi gateway, letakkan di
`~/.openclaw/.env` (atau environment service Anda). Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

Jika `provider: "perplexity"` dikonfigurasi dan SecretRef key Perplexity tidak terselesaikan tanpa fallback env, startup/reload akan langsung gagal.

## Parameter tool

Parameter-parameter ini berlaku untuk jalur API Pencarian Perplexity native.

| Parameter             | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `query`               | Query pencarian (wajib)                              |
| `count`               | Jumlah hasil yang dikembalikan (1-10, default: 5)    |
| `country`             | Kode negara ISO 2 huruf (mis. "US", "DE")            |
| `language`            | Kode bahasa ISO 639-1 (mis. "en", "de", "fr")        |
| `freshness`           | Filter waktu: `day` (24 jam), `week`, `month`, atau `year` |
| `date_after`          | Hanya hasil yang dipublikasikan setelah tanggal ini (YYYY-MM-DD) |
| `date_before`         | Hanya hasil yang dipublikasikan sebelum tanggal ini (YYYY-MM-DD) |
| `domain_filter`       | Array allowlist/denylist domain (maks 20)            |
| `max_tokens`          | Anggaran total konten (default: 25000, maks: 1000000) |
| `max_tokens_per_page` | Batas token per halaman (default: 2048)              |

Untuk jalur kompatibilitas Sonar/OpenRouter lama:

- `query`, `count`, dan `freshness` diterima
- `count` hanya untuk kompatibilitas di sana; respons tetap berupa satu
  jawaban sintetis dengan sitasi alih-alih daftar N hasil
- Filter khusus API Pencarian seperti `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, dan `max_tokens_per_page`
  mengembalikan error eksplisit

**Contoh:**

```javascript
// Pencarian spesifik negara dan bahasa
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Hasil terbaru (minggu lalu)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Pencarian rentang tanggal
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Penyaringan domain (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Penyaringan domain (denylist - awali dengan -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Ekstraksi konten lebih banyak
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Aturan filter domain

- Maksimum 20 domain per filter
- Tidak dapat mencampur allowlist dan denylist dalam permintaan yang sama
- Gunakan prefiks `-` untuk entri denylist (mis. `["-reddit.com"]`)

## Catatan

- API Pencarian Perplexity mengembalikan hasil pencarian web terstruktur (`title`, `url`, `snippet`)
- OpenRouter atau `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` eksplisit mengalihkan Perplexity kembali ke chat completions Sonar untuk kompatibilitas
- Kompatibilitas Sonar/OpenRouter mengembalikan satu jawaban sintetis dengan sitasi, bukan baris hasil terstruktur
- Hasil dicache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`)

Lihat [Web tools](/id/tools/web) untuk konfigurasi `web_search` lengkap.
Lihat [dokumen API Pencarian Perplexity](https://docs.perplexity.ai/docs/search/quickstart) untuk detail lebih lanjut.

## Terkait

- [Pencarian Perplexity](/id/tools/perplexity-search)
- [Pencarian web](/id/tools/web)
