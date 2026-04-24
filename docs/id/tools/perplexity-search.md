---
read_when:
    - Anda ingin menggunakan Perplexity Search untuk pencarian web
    - Anda perlu menyiapkan `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
summary: API Search Perplexity dan kompatibilitas Sonar/OpenRouter untuk `web_search`
title: pencarian Perplexity
x-i18n:
    generated_at: "2026-04-24T09:32:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# API Search Perplexity

OpenClaw mendukung API Search Perplexity sebagai provider `web_search`.
API ini mengembalikan hasil terstruktur dengan field `title`, `url`, dan `snippet`.

Untuk kompatibilitas, OpenClaw juga mendukung penyiapan Perplexity Sonar/OpenRouter lama.
Jika Anda menggunakan `OPENROUTER_API_KEY`, key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`, atau mengatur `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider beralih ke jalur chat-completions dan mengembalikan jawaban sintetis AI dengan sitasi alih-alih hasil API Search yang terstruktur.

## Mendapatkan API key Perplexity

1. Buat akun Perplexity di [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Buat API key di dashboard
3. Simpan key di konfigurasi atau atur `PERPLEXITY_API_KEY` di environment Gateway.

## Kompatibilitas OpenRouter

Jika Anda sudah menggunakan OpenRouter untuk Perplexity Sonar, pertahankan `provider: "perplexity"` dan atur `OPENROUTER_API_KEY` di environment Gateway, atau simpan key `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`.

Kontrol kompatibilitas opsional:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Contoh konfigurasi

### API Search Perplexity native

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

## Tempat mengatur key

**Melalui konfigurasi:** jalankan `openclaw configure --section web`. Ini menyimpan key di
`~/.openclaw/openclaw.json` pada `plugins.entries.perplexity.config.webSearch.apiKey`.
Field itu juga menerima objek SecretRef.

**Melalui environment:** atur `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
di environment proses Gateway. Untuk instalasi gateway, letakkan di
`~/.openclaw/.env` (atau environment layanan Anda). Lihat [Env vars](/id/help/faq#env-vars-and-env-loading).

Jika `provider: "perplexity"` dikonfigurasi dan SecretRef key Perplexity tidak terselesaikan tanpa fallback env, startup/reload gagal cepat.

## Parameter alat

Parameter ini berlaku untuk jalur API Search Perplexity native.

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang dikembalikan (1–10).
</ParamField>

<ParamField path="country" type="string">
Kode negara ISO 2 huruf (mis. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kode bahasa ISO 639-1 (mis. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu — `day` adalah 24 jam.
</ParamField>

<ParamField path="date_after" type="string">
Hanya hasil yang dipublikasikan setelah tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Hanya hasil yang dipublikasikan sebelum tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Array allowlist/denylist domain (maks 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Total anggaran konten (maks 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Batas token per halaman.
</ParamField>

Untuk jalur kompatibilitas Sonar/OpenRouter lama:

- `query`, `count`, dan `freshness` diterima
- `count` hanya untuk kompatibilitas di sana; respons tetap berupa satu jawaban
  sintetis dengan sitasi alih-alih daftar N-hasil
- Filter khusus API Search seperti `country`, `language`, `date_after`,
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
- Gunakan prefiks `-` untuk entri denylist (mis. `["-reddit.com"]`)

## Catatan

- API Search Perplexity mengembalikan hasil pencarian web terstruktur (`title`, `url`, `snippet`)
- OpenRouter atau `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` eksplisit mengalihkan Perplexity kembali ke chat completions Sonar untuk kompatibilitas
- Kompatibilitas Sonar/OpenRouter mengembalikan satu jawaban sintetis dengan sitasi, bukan baris hasil terstruktur
- Hasil di-cache selama 15 menit secara default (dapat dikonfigurasi melalui `cacheTtlMinutes`)

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Dokumen API Search Perplexity](https://docs.perplexity.ai/docs/search/quickstart) -- dokumentasi resmi Perplexity
- [Brave Search](/id/tools/brave-search) -- hasil terstruktur dengan filter negara/bahasa
- [Exa Search](/id/tools/exa-search) -- pencarian neural dengan ekstraksi konten
