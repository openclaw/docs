---
read_when:
    - Anda ingin menggunakan Perplexity Search untuk web search
    - Anda memerlukan setup `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
summary: API Perplexity Search dan kompatibilitas Sonar/OpenRouter untuk `web_search`
title: Perplexity Search (jalur lama)
x-i18n:
    generated_at: "2026-04-05T13:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# API Perplexity Search

OpenClaw mendukung API Perplexity Search sebagai penyedia `web_search`.
API ini mengembalikan hasil terstruktur dengan field `title`, `url`, dan `snippet`.

Untuk kompatibilitas, OpenClaw juga mendukung setup Perplexity Sonar/OpenRouter lama.
Jika Anda menggunakan `OPENROUTER_API_KEY`, key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`, atau menyetel `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, penyedia akan beralih ke jalur chat-completions dan mengembalikan jawaban sintetis AI dengan sitasi alih-alih hasil API Search yang terstruktur.

## Mendapatkan API key Perplexity

1. Buat akun Perplexity di [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Buat API key di dashboard
3. Simpan key di konfigurasi atau setel `PERPLEXITY_API_KEY` di environment Gateway.

## Kompatibilitas OpenRouter

Jika Anda sudah menggunakan OpenRouter untuk Perplexity Sonar, tetap gunakan `provider: "perplexity"` dan setel `OPENROUTER_API_KEY` di environment Gateway, atau simpan key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`.

Kontrol kompatibilitas opsional:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Contoh konfigurasi

### API Perplexity Search native

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

**Melalui konfigurasi:** jalankan `openclaw configure --section web`. Perintah ini menyimpan key di
`~/.openclaw/openclaw.json` pada `plugins.entries.perplexity.config.webSearch.apiKey`.
Field tersebut juga menerima objek SecretRef.

**Melalui environment:** setel `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
di environment proses Gateway. Untuk instalasi gateway, letakkan di
`~/.openclaw/.env` (atau environment service Anda). Lihat [Env vars](/help/faq#env-vars-and-env-loading).

Jika `provider: "perplexity"` dikonfigurasi dan SecretRef key Perplexity tidak ter-resolve tanpa fallback env, startup/reload akan gagal secara fail-fast.

## Parameter tool

Parameter ini berlaku untuk jalur API Perplexity Search native.

| Parameter             | Deskripsi                                            |
| --------------------- | ---------------------------------------------------- |
| `query`               | Query pencarian (wajib)                              |
| `count`               | Jumlah hasil yang dikembalikan (1-10, default: 5)    |
| `country`             | Kode negara ISO 2 huruf (misalnya, "US", "DE")       |
| `language`            | Kode bahasa ISO 639-1 (misalnya, "en", "de", "fr")   |
| `freshness`           | Filter waktu: `day` (24j), `week`, `month`, atau `year` |
| `date_after`          | Hanya hasil yang dipublikasikan setelah tanggal ini (YYYY-MM-DD) |
| `date_before`         | Hanya hasil yang dipublikasikan sebelum tanggal ini (YYYY-MM-DD) |
| `domain_filter`       | Array allowlist/denylist domain (maks 20)            |
| `max_tokens`          | Total anggaran konten (default: 25000, maks: 1000000) |
| `max_tokens_per_page` | Batas token per halaman (default: 2048)              |

Untuk jalur kompatibilitas Sonar/OpenRouter lama:

- `query`, `count`, dan `freshness` diterima
- `count` hanya untuk kompatibilitas di sana; respons tetap berupa satu
  jawaban sintetis dengan sitasi, bukan daftar N hasil
- Filter khusus Search API seperti `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, dan `max_tokens_per_page`
  mengembalikan error eksplisit

**Contoh:**

```javascript
// Pencarian khusus negara dan bahasa
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Hasil terbaru (seminggu terakhir)
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

// Pemfilteran domain (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Pemfilteran domain (denylist - awali dengan -)
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
- Gunakan prefiks `-` untuk entri denylist (misalnya `["-reddit.com"]`)

## Catatan

- API Perplexity Search mengembalikan hasil web search terstruktur (`title`, `url`, `snippet`)
- OpenRouter atau `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` eksplisit mengalihkan Perplexity kembali ke chat completions Sonar untuk kompatibilitas
- Kompatibilitas Sonar/OpenRouter mengembalikan satu jawaban sintetis dengan sitasi, bukan baris hasil terstruktur
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`)

Lihat [Web tools](/tools/web) untuk konfigurasi `web_search` lengkap.
Lihat [dokumentasi API Perplexity Search](https://docs.perplexity.ai/docs/search/quickstart) untuk detail lebih lanjut.
