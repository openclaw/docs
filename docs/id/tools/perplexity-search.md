---
read_when:
    - Anda ingin menggunakan Perplexity Search untuk pencarian web
    - Anda perlu menyiapkan `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
summary: API Perplexity Search dan kompatibilitas Sonar/OpenRouter untuk `web_search`
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T14:08:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API Perplexity Search

OpenClaw mendukung API Perplexity Search sebagai penyedia `web_search`.
API ini mengembalikan hasil terstruktur dengan bidang `title`, `url`, dan `snippet`.

Untuk kompatibilitas, OpenClaw juga mendukung penyiapan Perplexity Sonar/OpenRouter lama.
Jika Anda menggunakan `OPENROUTER_API_KEY`, kunci `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`, atau menyetel `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, penyedia akan beralih ke jalur chat-completions dan mengembalikan jawaban hasil sintesis AI dengan sitasi alih-alih hasil API Search yang terstruktur.

## Mendapatkan API key Perplexity

1. Buat akun Perplexity di [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Buat API key di dashboard
3. Simpan kunci di konfigurasi atau setel `PERPLEXITY_API_KEY` di lingkungan Gateway.

## Kompatibilitas OpenRouter

Jika Anda sudah menggunakan OpenRouter untuk Perplexity Sonar, tetap gunakan `provider: "perplexity"` dan setel `OPENROUTER_API_KEY` di lingkungan Gateway, atau simpan kunci `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`.

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

## Tempat menyetel kunci

**Melalui konfigurasi:** jalankan `openclaw configure --section web`. Ini menyimpan kunci di
`~/.openclaw/openclaw.json` di bawah `plugins.entries.perplexity.config.webSearch.apiKey`.
Bidang tersebut juga menerima objek SecretRef.

**Melalui environment:** setel `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
di lingkungan proses Gateway. Untuk instalasi gateway, letakkan di
`~/.openclaw/.env` (atau environment layanan Anda). Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

Jika `provider: "perplexity"` dikonfigurasi dan SecretRef kunci Perplexity tidak teresolusikan tanpa fallback env, startup/reload akan langsung gagal.

## Parameter tool

Parameter ini berlaku untuk jalur API Perplexity Search native.

| Parameter             | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| `query`               | Kueri pencarian (wajib)                            |
| `count`               | Jumlah hasil yang dikembalikan (1-10, default: 5)  |
| `country`             | Kode negara ISO 2 huruf (mis., "US", "DE")         |
| `language`            | Kode bahasa ISO 639-1 (mis., "en", "de", "fr")     |
| `freshness`           | Filter waktu: `day` (24 jam), `week`, `month`, atau `year` |
| `date_after`          | Hanya hasil yang dipublikasikan setelah tanggal ini (YYYY-MM-DD) |
| `date_before`         | Hanya hasil yang dipublikasikan sebelum tanggal ini (YYYY-MM-DD) |
| `domain_filter`       | Array allowlist/denylist domain (maks. 20)         |
| `max_tokens`          | Total anggaran konten (default: 25000, maks: 1000000) |
| `max_tokens_per_page` | Batas token per halaman (default: 2048)            |

Untuk jalur kompatibilitas Sonar/OpenRouter lama:

- `query`, `count`, dan `freshness` diterima
- `count` hanya untuk kompatibilitas di sana; responsnya tetap berupa satu jawaban hasil sintesis
  dengan sitasi, bukan daftar N hasil
- Filter khusus API Search seperti `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, dan `max_tokens_per_page`
  akan mengembalikan error eksplisit

**Contoh:**

```javascript
// Pencarian khusus negara dan bahasa
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

- API Perplexity Search mengembalikan hasil pencarian web terstruktur (`title`, `url`, `snippet`)
- OpenRouter atau `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` eksplisit mengalihkan Perplexity kembali ke chat completions Sonar demi kompatibilitas
- Kompatibilitas Sonar/OpenRouter mengembalikan satu jawaban hasil sintesis dengan sitasi, bukan baris hasil terstruktur
- Hasil dicache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`)

## Terkait

- [Gambaran umum Web Search](/tools/web) -- semua penyedia dan deteksi otomatis
- [Dokumen API Perplexity Search](https://docs.perplexity.ai/docs/search/quickstart) -- dokumentasi resmi Perplexity
- [Brave Search](/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Exa Search](/tools/exa-search) -- pencarian neural dengan ekstraksi konten
