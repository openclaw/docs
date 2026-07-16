---
read_when:
    - Anda menginginkan ekstraksi web yang didukung Firecrawl
    - Anda menginginkan Firecrawl Search tanpa kunci (Gratis) atau web_fetch tanpa kunci
    - Anda memerlukan kunci API Firecrawl untuk pencarian atau batas yang lebih tinggi
    - Anda ingin Firecrawl sebagai penyedia web_search
    - Anda menginginkan ekstraksi anti-bot untuk web_fetch
summary: Pencarian, scraping, dan fallback web_fetch Firecrawl
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T18:48:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw dapat menggunakan **Firecrawl** dalam tiga cara:

- sebagai penyedia `web_search`
- sebagai alat plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai ekstraktor cadangan untuk `web_fetch`

Firecrawl adalah layanan ekstraksi/pencarian terkelola yang mendukung pengelakan bot dan penyimpanan cache, sehingga membantu menangani situs yang sangat bergantung pada JS atau halaman yang memblokir pengambilan HTTP biasa.

## Instal plugin

Instal plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Akses tanpa kunci dan kunci API

Firecrawl mendaftarkan dua penyedia `web_search`:

- **Pencarian Firecrawl** (`firecrawl`) — menggunakan API `/v2/search` terkelola dengan kunci Anda; terdeteksi otomatis ketika tersedia kunci.
- **Pencarian Firecrawl (Gratis)** (`firecrawl-free`) — menggunakan tingkat pemula terkelola tanpa kunci, tanpa memerlukan kunci API. Opsi ini **hanya dapat diaktifkan secara eksplisit** dan tidak pernah dipilih otomatis karena memilihnya akan mengirimkan kueri pencarian Anda ke tingkat gratis Firecrawl.

Fallback `web_fetch` Firecrawl yang dipilih secara eksplisit juga tidak memerlukan kunci. Alat `firecrawl_search` dan `firecrawl_scrape` eksplisit memerlukan kunci API. Tambahkan `FIRECRAWL_API_KEY` di lingkungan Gateway atau konfigurasikan untuk batas yang lebih tinggi.

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

- Memilih Firecrawl saat orientasi atau `openclaw configure --section web` akan mengaktifkan plugin Firecrawl yang terinstal secara otomatis.
- Pilih **Pencarian Firecrawl (Gratis)** saat orientasi (atau tetapkan `provider: "firecrawl-free"`) agar berjalan tanpa kunci API. Penyedia **Pencarian Firecrawl** berkunci mengirimkan `plugins.entries.firecrawl.config.webSearch.apiKey` atau `FIRECRAWL_API_KEY`.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau pengambilan hasil, gunakan `firecrawl_search`.
- `baseUrl` secara default menggunakan Firecrawl terkelola di `https://api.firecrawl.dev`. Penggantian yang dihosting sendiri hanya diizinkan untuk endpoint privat/internal; HTTP hanya diterima untuk target privat tersebut.
- `FIRECRAWL_BASE_URL` adalah fallback variabel lingkungan bersama untuk URL dasar pencarian dan pengambilan Firecrawl.
- Permintaan pencarian Firecrawl secara default memiliki batas waktu 30 detik; parameter `timeoutSeconds` milik `firecrawl_search` menggantikannya untuk setiap panggilan.

## Konfigurasikan fallback web_fetch Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // pemilihan eksplisit mengaktifkan fallback tanpa kunci
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

- Fallback `web_fetch` Firecrawl yang dipilih secara eksplisit berfungsi tanpa kunci API. Jika dikonfigurasi, OpenClaw mengirimkan `plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY` untuk batas yang lebih tinggi.
- Memilih Firecrawl saat orientasi atau `openclaw configure --section web` akan mengaktifkan plugin dan memilih Firecrawl untuk `web_fetch`, kecuali penyedia pengambilan lain telah dikonfigurasi.
- `firecrawl_scrape` memerlukan kunci API.
- `maxAgeMs` mengontrol seberapa lama hasil cache boleh digunakan (ms). Nilai defaultnya adalah 172.800.000 ms (2 hari).
- `onlyMainContent` secara default adalah `true`; `timeoutSeconds` secara default adalah 60.
- Konfigurasi lama `tools.web.fetch.firecrawl.*` dan `tools.web.search.firecrawl.*` dimigrasikan secara otomatis oleh `openclaw doctor --fix`.
- Penggantian URL pengambilan/dasar Firecrawl mengikuti aturan terkelola/privat yang sama seperti pencarian: lalu lintas publik terkelola menggunakan `https://api.firecrawl.dev`; penggantian yang dihosting sendiri harus mengarah ke endpoint privat/internal.
- `firecrawl_scrape` menolak URL target yang jelas bersifat privat, loopback, metadata, dan non-HTTP(S) sebelum meneruskannya ke Firecrawl, sesuai dengan kontrak keamanan target `web_fetch` untuk panggilan pengambilan Firecrawl eksplisit.

`firecrawl_scrape` menggunakan kembali pengaturan dan variabel lingkungan `plugins.entries.firecrawl.config.webFetch.*` yang sama, termasuk kunci API wajibnya.

### Firecrawl yang dihosting sendiri

Tetapkan `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl`, atau `FIRECRAWL_BASE_URL` saat Anda menjalankan Firecrawl sendiri. OpenClaw hanya menerima `http://` untuk target loopback, jaringan privat, `.local`, `.internal`, atau `.localhost`. Host publik khusus ditolak agar kunci API Firecrawl tidak terkirim secara tidak sengaja ke endpoint sembarang.

## Alat plugin Firecrawl

### `firecrawl_search`

Gunakan ini jika Anda menginginkan kontrol pencarian khusus Firecrawl, bukan `web_search` generik. Memerlukan kunci API.

Parameter:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (hanya nama host; saling eksklusif)
- `tbs` (filter waktu, misalnya `qdr:d`, `qdr:w`, `sbd:1`)
- `location` dan `country` (penargetan geografis)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman yang sangat bergantung pada JS atau dilindungi dari bot, ketika `web_fetch` biasa tidak memadai.

Parameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Mode siluman / pengelakan bot

`firecrawl_scrape` dan fallback Firecrawl `web_fetch` secara default menggunakan `proxy: "auto"` beserta `storeInCache: true`, kecuali pemanggil mengganti parameter tersebut. `firecrawl_search` dan penyedia Firecrawl `web_search` tidak memiliki kontrol `proxy`/`storeInCache`; mode proksi siluman hanya berlaku untuk permintaan pengambilan.

Mode `proxy` Firecrawl mengontrol pengelakan bot (`basic`, `stealth`, atau `auto`). `auto` mencoba kembali dengan proksi siluman jika upaya dasar gagal, yang mungkin menggunakan lebih banyak kredit daripada pengambilan dengan mode dasar saja.

## Cara `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Penyedia pengambilan yang dikonfigurasi, seperti Firecrawl (ketika dipilih atau terdeteksi otomatis dari kredensial yang dikonfigurasi)
3. Pembersihan HTML dasar (fallback terakhir)

Kontrol pemilihannya adalah `tools.web.fetch.provider`. Jika dihilangkan, OpenClaw mendeteksi secara otomatis penyedia pengambilan web pertama yang siap berdasarkan kredensial yang tersedia. Plugin Firecrawl resmi menyediakan fallback tersebut.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pengambilan Web](/id/tools/web-fetch) -- alat web_fetch dengan fallback Firecrawl
- [Tavily](/id/tools/tavily) -- alat pencarian + ekstraksi
