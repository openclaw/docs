---
read_when:
    - Anda ingin menggunakan Perplexity Search untuk pencarian web
    - Anda perlu menyiapkan `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY`
summary: API Perplexity Search dan kompatibilitas Sonar/OpenRouter untuk web_search
title: Pencarian Perplexity
x-i18n:
    generated_at: "2026-07-12T14:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw mendukung Perplexity Search API sebagai penyedia `web_search`. API ini mengembalikan hasil terstruktur dengan bidang `title`, `url`, dan `snippet`.

Untuk kompatibilitas, OpenClaw juga mendukung konfigurasi lama Perplexity Sonar/OpenRouter. Jika Anda menggunakan `OPENROUTER_API_KEY`, kunci `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`, atau menetapkan `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, penyedia akan beralih ke jalur penyelesaian percakapan dan mengembalikan jawaban yang disintesis AI beserta kutipan, alih-alih hasil Search API terstruktur.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Mendapatkan kunci API Perplexity

1. Buat akun Perplexity di [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Buat kunci API di dasbor.
3. Simpan kunci dalam konfigurasi atau tetapkan `PERPLEXITY_API_KEY` di lingkungan Gateway.

## Kompatibilitas OpenRouter

Jika Anda telah menggunakan OpenRouter untuk Perplexity Sonar, pertahankan `provider: "perplexity"` dan tetapkan `OPENROUTER_API_KEY` di lingkungan Gateway, atau simpan kunci `sk-or-...` di `plugins.entries.perplexity.config.webSearch.apiKey`.

Kontrol kompatibilitas opsional:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Contoh konfigurasi

### Perplexity Search API asli

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

## Tempat menetapkan kunci

**Melalui konfigurasi:** jalankan `openclaw configure --section web`. Perintah ini menyimpan kunci di `~/.openclaw/openclaw.json` pada `plugins.entries.perplexity.config.webSearch.apiKey`. Bidang tersebut juga menerima objek SecretRef.

**Melalui lingkungan:** tetapkan `PERPLEXITY_API_KEY` atau `OPENROUTER_API_KEY` di lingkungan proses Gateway. Untuk instalasi Gateway, letakkan di `~/.openclaw/.env` (atau lingkungan layanan Anda). Lihat [Variabel lingkungan](/id/help/faq#env-vars-and-env-loading).

Jika `provider: "perplexity"` dikonfigurasi dan SecretRef kunci Perplexity tidak dapat diurai tanpa nilai pengganti dari lingkungan, proses mulai ulang/pemuatan ulang akan segera gagal.

## Parameter alat

Parameter ini berlaku untuk jalur Perplexity Search API asli.

<ParamField path="query" type="string" required>
Kueri pencarian.
</ParamField>

<ParamField path="count" type="number" default="5">
Jumlah hasil yang akan dikembalikan (1-10).
</ParamField>

<ParamField path="country" type="string">
Kode negara ISO 2 huruf (misalnya `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kode bahasa ISO 639-1 (misalnya `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filter waktu—`day` berarti 24 jam.
</ParamField>

<ParamField path="date_after" type="string">
Hanya hasil yang diterbitkan setelah tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Hanya hasil yang diterbitkan sebelum tanggal ini (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Larik daftar izin/daftar blokir domain (maks. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Anggaran konten total (maks. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Batas token per halaman.
</ParamField>

Untuk jalur kompatibilitas lama Sonar/OpenRouter:

- `query`, `count`, dan `freshness` diterima.
- Di jalur tersebut, `count` hanya untuk kompatibilitas; responsnya tetap berupa satu jawaban yang disintesis beserta kutipan, bukan daftar berisi N hasil.
- Filter khusus Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) mengembalikan galat eksplisit.

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

// Pemfilteran domain (daftar izin)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Pemfilteran domain (daftar blokir—awali dengan -)
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

- Maksimal 20 domain per filter.
- Entri daftar izin dan daftar blokir tidak dapat digabungkan dalam permintaan yang sama.
- Gunakan awalan `-` untuk entri daftar blokir (misalnya `["-reddit.com"]`).

## Catatan

- Perplexity Search API mengembalikan hasil pencarian web terstruktur (`title`, `url`, `snippet`).
- OpenRouter, atau `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` yang ditetapkan secara eksplisit, mengalihkan Perplexity kembali ke penyelesaian percakapan Sonar demi kompatibilitas.
- Kompatibilitas Sonar/OpenRouter mengembalikan satu jawaban yang disintesis beserta kutipan, bukan baris hasil terstruktur.
- Secara default, hasil disimpan dalam tembolok selama 15 menit (dapat dikonfigurasi melalui `cacheTtlMinutes`).

## Terkait

<CardGroup cols={2}>
  <Card title="Ikhtisar pencarian web" href="/id/tools/web" icon="globe">
    Semua penyedia dan aturan deteksi otomatis.
  </Card>
  <Card title="Pencarian Brave" href="/id/tools/brave-search" icon="shield">
    Hasil terstruktur dengan filter negara dan bahasa.
  </Card>
  <Card title="Pencarian Exa" href="/id/tools/exa-search" icon="magnifying-glass">
    Pencarian neural dengan ekstraksi konten.
  </Card>
  <Card title="Dokumentasi Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Panduan memulai cepat dan referensi resmi Perplexity Search API.
  </Card>
</CardGroup>
