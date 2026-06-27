---
read_when:
    - Anda menginginkan ekstraksi web yang didukung Firecrawl
    - Anda menginginkan Firecrawl web_fetch tanpa kunci
    - Anda memerlukan kunci API Firecrawl untuk pencarian atau batas yang lebih tinggi
    - Anda menginginkan Firecrawl sebagai penyedia web_search
    - Anda menginginkan ekstraksi anti-bot untuk web_fetch
summary: Pencarian, pengambilan data web, dan cadangan web_fetch Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:18:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw dapat menggunakan **Firecrawl** dalam tiga cara:

- sebagai penyedia `web_search`
- sebagai alat Plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai ekstraktor fallback untuk `web_fetch`

Ini adalah layanan ekstraksi/pencarian terhosting yang mendukung pengelakan bot dan caching,
yang membantu untuk situs berat JS atau halaman yang memblokir pengambilan HTTP biasa.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch tanpa kunci dan kunci API

Fallback `web_fetch` Firecrawl terhosting yang dipilih secara eksplisit mendukung akses
pemula tanpa kunci API. Tambahkan `FIRECRAWL_API_KEY` di lingkungan gateway
atau konfigurasikan saat Anda membutuhkan batas yang lebih tinggi. Firecrawl `web_search` dan
`firecrawl_scrape` memerlukan kunci API.

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

- Memilih Firecrawl saat onboarding atau `openclaw configure --section web` mengaktifkan Plugin Firecrawl yang terinstal secara otomatis.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau scraping hasil, gunakan `firecrawl_search`.
- `baseUrl` secara default mengarah ke Firecrawl terhosting di `https://api.firecrawl.dev`. Override yang di-hosting sendiri hanya diizinkan untuk endpoint privat/internal; HTTP hanya diterima untuk target privat tersebut.
- `FIRECRAWL_BASE_URL` adalah fallback env bersama untuk URL dasar pencarian dan scrape Firecrawl.

## Konfigurasikan fallback web_fetch Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Fallback `web_fetch` Firecrawl yang dipilih secara eksplisit berfungsi tanpa kunci API. Saat dikonfigurasi, OpenClaw mengirim `plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY` untuk batas yang lebih tinggi.
- Memilih Firecrawl saat onboarding atau `openclaw configure --section web` mengaktifkan Plugin dan memilih Firecrawl untuk `web_fetch` kecuali penyedia fetch lain sudah dikonfigurasi.
- `firecrawl_scrape` memerlukan kunci API.
- `maxAgeMs` mengontrol seberapa lama hasil cache boleh digunakan (ms). Defaultnya adalah 2 hari.
- Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.
- Override URL scrape/dasar Firecrawl mengikuti aturan terhosting/privat yang sama seperti pencarian: lalu lintas terhosting publik menggunakan `https://api.firecrawl.dev`; override yang di-hosting sendiri harus mengarah ke endpoint privat/internal.
- `firecrawl_scrape` menolak URL target privat, loopback, metadata, dan non-HTTP(S) yang jelas sebelum meneruskannya ke Firecrawl, sesuai dengan kontrak keamanan target `web_fetch` untuk panggilan scrape Firecrawl eksplisit.

`firecrawl_scrape` menggunakan ulang pengaturan dan env var `plugins.entries.firecrawl.config.webFetch.*` yang sama, termasuk kunci API yang diwajibkan.

### Firecrawl yang di-hosting sendiri

Tetapkan `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl`, atau `FIRECRAWL_BASE_URL`
saat Anda menjalankan Firecrawl sendiri. OpenClaw menerima `http://` hanya untuk target loopback,
jaringan privat, `.local`, `.internal`, atau `.localhost`. Host kustom publik
ditolak agar kunci API Firecrawl tidak terkirim ke endpoint sembarang secara
tidak sengaja.

## Alat Plugin Firecrawl

### `firecrawl_search`

Gunakan ini saat Anda menginginkan kontrol pencarian khusus Firecrawl, bukan `web_search` generik.

Parameter inti:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman berat JS atau dilindungi bot, tempat `web_fetch` biasa kurang kuat.

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
Jika proxy dihilangkan, Firecrawl secara default menggunakan `auto`. `auto` mencoba ulang dengan proxy stealth jika upaya dasar gagal, yang mungkin menggunakan lebih banyak kredit
daripada scraping basic-only.

## Cara `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Firecrawl (saat dipilih, atau terdeteksi otomatis dari kredensial yang dikonfigurasi)
3. Pembersihan HTML dasar (fallback terakhir)

Kenop pemilihannya adalah `tools.web.fetch.provider`. Jika Anda menghilangkannya, OpenClaw
mendeteksi otomatis penyedia web-fetch pertama yang siap dari kredensial yang tersedia.
Plugin Firecrawl resmi menyediakan fallback tersebut.

## Terkait

- [Ringkasan Web Search](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Web Fetch](/id/tools/web-fetch) -- alat web_fetch dengan fallback Firecrawl
- [Tavily](/id/tools/tavily) -- alat pencarian + ekstraksi
