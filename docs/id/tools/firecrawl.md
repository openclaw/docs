---
read_when:
    - Anda menginginkan ekstraksi web yang didukung Firecrawl
    - Anda memerlukan kunci API Firecrawl
    - Anda ingin Firecrawl sebagai penyedia web_search
    - Anda menginginkan ekstraksi anti-bot untuk web_fetch
summary: Pencarian Firecrawl, pengambilan data web, dan mekanisme pengganti web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T09:34:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw dapat menggunakan **Firecrawl** dalam tiga cara:

- sebagai penyedia `web_search`
- sebagai alat Plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai ekstraktor fallback untuk `web_fetch`

Ini adalah layanan ekstraksi/pencarian terhosting yang mendukung pengelakan bot dan caching,
yang membantu untuk situs berat JS atau halaman yang memblokir fetch HTTP biasa.

## Dapatkan API key

1. Buat akun Firecrawl dan hasilkan API key.
2. Simpan di konfigurasi atau setel `FIRECRAWL_API_KEY` di lingkungan gateway.

## Konfigurasi pencarian Firecrawl

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

- Memilih Firecrawl saat onboarding atau `openclaw configure --section web` mengaktifkan Plugin Firecrawl bawaan secara otomatis.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau scraping hasil, gunakan `firecrawl_search`.
- `baseUrl` default ke Firecrawl terhosting di `https://api.firecrawl.dev`. Override yang dihosting sendiri hanya diizinkan untuk endpoint privat/internal; HTTP hanya diterima untuk target privat tersebut.
- `FIRECRAWL_BASE_URL` adalah fallback env bersama untuk URL dasar pencarian dan scrape Firecrawl.

## Konfigurasi scrape Firecrawl + fallback web_fetch

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

- Upaya fallback Firecrawl hanya berjalan ketika API key tersedia (`plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY`).
- `maxAgeMs` mengontrol seberapa lama hasil cache dapat digunakan (ms). Default-nya adalah 2 hari.
- Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
- Override URL scrape/dasar Firecrawl mengikuti aturan terhosting/privat yang sama seperti pencarian: lalu lintas terhosting publik menggunakan `https://api.firecrawl.dev`; override yang dihosting sendiri harus resolve ke endpoint privat/internal.
- `firecrawl_scrape` menolak URL target privat, loopback, metadata, dan non-HTTP(S) yang jelas sebelum meneruskannya ke Firecrawl, sesuai dengan kontrak keamanan target `web_fetch` untuk panggilan scrape Firecrawl eksplisit.

`firecrawl_scrape` menggunakan kembali pengaturan `plugins.entries.firecrawl.config.webFetch.*` dan env var yang sama.

### Firecrawl yang dihosting sendiri

Setel `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl`, atau `FIRECRAWL_BASE_URL`
ketika Anda menjalankan Firecrawl sendiri. OpenClaw menerima `http://` hanya untuk target loopback,
jaringan privat, `.local`, `.internal`, atau `.localhost`. Host kustom publik
ditolak agar API key Firecrawl tidak terkirim ke endpoint sembarang secara
tidak sengaja.

## Alat Plugin Firecrawl

### `firecrawl_search`

Gunakan ini ketika Anda menginginkan kontrol pencarian khusus Firecrawl, bukan `web_search` generik.

Parameter inti:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman berat JS atau dilindungi bot ketika `web_fetch` biasa kurang memadai.

Parameter inti:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / pengelakan bot

Firecrawl mengekspos parameter **mode proxy** untuk pengelakan bot (`basic`, `stealth`, atau `auto`).
OpenClaw selalu menggunakan `proxy: "auto"` plus `storeInCache: true` untuk permintaan Firecrawl.
Jika proxy dihilangkan, Firecrawl default ke `auto`. `auto` mencoba ulang dengan proxy stealth jika upaya dasar gagal, yang dapat menggunakan lebih banyak kredit
daripada scraping basic-only.

## Bagaimana `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Firecrawl (jika dipilih atau terdeteksi otomatis sebagai fallback web-fetch aktif)
3. Pembersihan HTML dasar (fallback terakhir)

Tombol pemilihan adalah `tools.web.fetch.provider`. Jika Anda menghilangkannya, OpenClaw
mendeteksi otomatis penyedia web-fetch pertama yang siap dari kredensial yang tersedia.
Saat ini penyedia bawaan adalah Firecrawl.

## Terkait

- [Ikhtisar Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Web Fetch](/id/tools/web-fetch) -- alat web_fetch dengan fallback Firecrawl
- [Tavily](/id/tools/tavily) -- alat pencarian + ekstraksi
