---
read_when:
    - Anda menginginkan ekstraksi web berbasis Firecrawl
    - Anda memerlukan API key Firecrawl
    - Anda menginginkan Firecrawl sebagai provider `web_search`
    - Anda menginginkan ekstraksi anti-bot untuk `web_fetch`
summary: Pencarian Firecrawl, scrape, dan fallback web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T09:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw dapat menggunakan **Firecrawl** dalam tiga cara:

- sebagai provider `web_search`
- sebagai alat Plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai extractor fallback untuk `web_fetch`

Ini adalah layanan ekstraksi/pencarian terhosting yang mendukung penghindaran bot dan caching,
yang membantu untuk situs dengan JS berat atau halaman yang memblokir fetch HTTP biasa.

## Dapatkan API key

1. Buat akun Firecrawl dan hasilkan API key.
2. Simpan di konfigurasi atau tetapkan `FIRECRAWL_API_KEY` di lingkungan gateway.

## Konfigurasikan pencarian Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Catatan:

- Memilih Firecrawl dalam onboarding atau `openclaw configure --section web` akan otomatis mengaktifkan Plugin Firecrawl bawaan.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau scrape hasil, gunakan `firecrawl_search`.
- Penggantian `baseUrl` harus tetap di `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` adalah fallback env bersama untuk base URL pencarian dan scrape Firecrawl.

## Konfigurasikan scrape Firecrawl + fallback web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Catatan:

- Upaya fallback Firecrawl hanya berjalan jika API key tersedia (`plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY`).
- `maxAgeMs` mengontrol seberapa lama hasil cache masih dapat digunakan (ms). Default adalah 2 hari.
- Konfigurasi legacy `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
- Penggantian scrape/base URL Firecrawl dibatasi ke `https://api.firecrawl.dev`.

`firecrawl_scrape` menggunakan kembali pengaturan dan variabel env `plugins.entries.firecrawl.config.webFetch.*` yang sama.

## Alat Plugin Firecrawl

### `firecrawl_search`

Gunakan ini ketika Anda menginginkan kontrol pencarian khusus Firecrawl alih-alih `web_search` generik.

Parameter inti:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman dengan JS berat atau yang dilindungi bot saat `web_fetch` biasa kurang memadai.

Parameter inti:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / penghindaran bot

Firecrawl mengekspos parameter **mode proxy** untuk penghindaran bot (`basic`, `stealth`, atau `auto`).
OpenClaw selalu menggunakan `proxy: "auto"` ditambah `storeInCache: true` untuk permintaan Firecrawl.
Jika proxy dihilangkan, Firecrawl default ke `auto`. `auto` akan mencoba lagi dengan proxy stealth jika percobaan basic gagal, yang mungkin menggunakan lebih banyak kredit
dibanding scraping khusus basic.

## Cara `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Firecrawl (jika dipilih atau terdeteksi otomatis sebagai fallback web-fetch aktif)
3. Pembersihan HTML dasar (fallback terakhir)

Opsi pemilihannya adalah `tools.web.fetch.provider`. Jika Anda tidak menetapkannya, OpenClaw
akan mendeteksi otomatis provider web-fetch pertama yang siap dari kredensial yang tersedia.
Saat ini provider bawaan adalah Firecrawl.

## Terkait

- [Gambaran umum Web Search](/id/tools/web) -- semua provider dan deteksi otomatis
- [Web Fetch](/id/tools/web-fetch) -- alat `web_fetch` dengan fallback Firecrawl
- [Tavily](/id/tools/tavily) -- alat pencarian + ekstraksi
