---
read_when:
    - Anda ingin ekstraksi web yang didukung Firecrawl
    - Anda memerlukan API key Firecrawl
    - Anda ingin Firecrawl sebagai provider `web_search`
    - Anda ingin ekstraksi anti-bot untuk `web_fetch`
summary: Pencarian Firecrawl, scrape, dan fallback `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T14:08:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw dapat menggunakan **Firecrawl** dengan tiga cara:

- sebagai provider `web_search`
- sebagai tool plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai extractor fallback untuk `web_fetch`

Ini adalah layanan pencarian/ekstraksi terhosting yang mendukung penghindaran bot dan caching,
yang membantu untuk situs berat JS atau halaman yang memblokir fetch HTTP biasa.

## Dapatkan API key

1. Buat akun Firecrawl dan hasilkan API key.
2. Simpan di config atau setel `FIRECRAWL_API_KEY` di lingkungan gateway.

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

- Memilih Firecrawl saat onboarding atau `openclaw configure --section web` secara otomatis mengaktifkan plugin Firecrawl bawaan.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau scraping hasil, gunakan `firecrawl_search`.
- Override `baseUrl` harus tetap menggunakan `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` adalah fallback env bersama untuk base URL pencarian dan scrape Firecrawl.

## Konfigurasikan scrape Firecrawl + fallback `web_fetch`

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

- Upaya fallback Firecrawl hanya dijalankan saat API key tersedia (`plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY`).
- `maxAgeMs` mengontrol seberapa lama hasil cache boleh digunakan (ms). Default-nya 2 hari.
- Config lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
- Override URL scrape/base Firecrawl dibatasi ke `https://api.firecrawl.dev`.

`firecrawl_scrape` menggunakan kembali pengaturan dan env var `plugins.entries.firecrawl.config.webFetch.*` yang sama.

## Tool plugin Firecrawl

### `firecrawl_search`

Gunakan ini saat Anda menginginkan kontrol pencarian khusus Firecrawl alih-alih `web_search` generik.

Parameter inti:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman berat JS atau dilindungi bot saat `web_fetch` biasa kurang memadai.

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

Firecrawl mengekspos parameter **proxy mode** untuk penghindaran bot (`basic`, `stealth`, atau `auto`).
OpenClaw selalu menggunakan `proxy: "auto"` plus `storeInCache: true` untuk permintaan Firecrawl.
Jika proxy dihilangkan, Firecrawl default ke `auto`. `auto` mencoba ulang dengan proxy stealth jika upaya basic gagal, yang dapat menggunakan lebih banyak kredit
daripada scraping basic-only.

## Cara `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Firecrawl (jika dipilih atau terdeteksi otomatis sebagai fallback web-fetch aktif)
3. Pembersihan HTML dasar (fallback terakhir)

Pengaturan pemilihannya adalah `tools.web.fetch.provider`. Jika Anda menghilangkannya, OpenClaw
mendeteksi otomatis provider web-fetch siap pertama dari kredensial yang tersedia.
Saat ini provider bawaannya adalah Firecrawl.

## Terkait

- [Ikhtisar Pencarian Web](/tools/web) -- semua provider dan deteksi otomatis
- [Web Fetch](/tools/web-fetch) -- tool `web_fetch` dengan fallback Firecrawl
- [Tavily](/tools/tavily) -- tool pencarian + ekstraksi
