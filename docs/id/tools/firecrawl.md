---
read_when:
    - Anda ingin ekstraksi web yang didukung Firecrawl
    - Anda ingin `web_fetch` Firecrawl tanpa kunci
    - Anda memerlukan kunci API Firecrawl untuk pencarian atau batas yang lebih tinggi
    - Anda ingin Firecrawl sebagai penyedia web_search
    - Anda ingin ekstraksi anti-bot untuk `web_fetch`
summary: Pencarian Firecrawl, scraping, dan fallback web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T14:46:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw dapat menggunakan **Firecrawl** dengan tiga cara:

- sebagai penyedia `web_search`
- sebagai alat Plugin eksplisit: `firecrawl_search` dan `firecrawl_scrape`
- sebagai pengekstrak cadangan untuk `web_fetch`

Firecrawl adalah layanan ekstraksi/pencarian terkelola yang mendukung pengelakan bot dan penyimpanan cache, sehingga membantu menangani situs yang sangat bergantung pada JS atau halaman yang memblokir pengambilan HTTP biasa.

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch tanpa kunci dan kunci API

Cadangan `web_fetch` Firecrawl terkelola yang dipilih secara eksplisit mendukung akses awal tanpa kunci API. Tambahkan `FIRECRAWL_API_KEY` ke lingkungan Gateway atau konfigurasikan saat Anda memerlukan batas yang lebih tinggi. `web_search` dan `firecrawl_scrape` Firecrawl memerlukan kunci API.

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

- Memilih Firecrawl dalam orientasi awal atau `openclaw configure --section web` akan mengaktifkan Plugin Firecrawl yang telah diinstal secara otomatis.
- `web_search` dengan Firecrawl mendukung `query` dan `count`.
- Untuk kontrol khusus Firecrawl seperti `sources`, `categories`, atau pengikisan hasil, gunakan `firecrawl_search`.
- Nilai bawaan `baseUrl` adalah Firecrawl terkelola di `https://api.firecrawl.dev`. Penggantian dengan layanan yang dihosting sendiri hanya diizinkan untuk titik akhir privat/internal; HTTP hanya diterima untuk target privat tersebut.
- `FIRECRAWL_BASE_URL` adalah cadangan variabel lingkungan bersama untuk URL dasar pencarian dan pengikisan Firecrawl.
- Permintaan pencarian Firecrawl secara bawaan memiliki batas waktu 30 detik; parameter `timeoutSeconds` milik `firecrawl_search` menggantikannya untuk setiap panggilan.

## Konfigurasikan cadangan web_fetch Firecrawl

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // pemilihan eksplisit mengaktifkan cadangan tanpa kunci
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

- Cadangan `web_fetch` Firecrawl yang dipilih secara eksplisit berfungsi tanpa kunci API. Jika dikonfigurasi, OpenClaw mengirim `plugins.entries.firecrawl.config.webFetch.apiKey` atau `FIRECRAWL_API_KEY` untuk memperoleh batas yang lebih tinggi.
- Memilih Firecrawl selama orientasi awal atau melalui `openclaw configure --section web` akan mengaktifkan Plugin dan memilih Firecrawl untuk `web_fetch`, kecuali penyedia pengambilan lain sudah dikonfigurasi.
- `firecrawl_scrape` memerlukan kunci API.
- `maxAgeMs` mengontrol umur maksimum hasil dalam cache (ms). Nilai bawaannya adalah 172.800.000 ms (2 hari).
- Nilai bawaan `onlyMainContent` adalah `true`; nilai bawaan `timeoutSeconds` adalah 60.
- Konfigurasi lama `tools.web.fetch.firecrawl.*` dan `tools.web.search.firecrawl.*` dimigrasikan secara otomatis oleh `openclaw doctor --fix`.
- Penggantian URL dasar/pengikisan Firecrawl mengikuti aturan terkelola/privat yang sama dengan pencarian: lalu lintas terkelola publik menggunakan `https://api.firecrawl.dev`; penggantian dengan layanan yang dihosting sendiri harus mengarah ke titik akhir privat/internal.
- `firecrawl_scrape` menolak URL target yang jelas-jelas privat, loopback, metadata, dan non-HTTP(S) sebelum meneruskannya ke Firecrawl, sesuai dengan kontrak keamanan target `web_fetch` untuk panggilan pengikisan Firecrawl secara eksplisit.

`firecrawl_scrape` menggunakan kembali pengaturan dan variabel lingkungan `plugins.entries.firecrawl.config.webFetch.*` yang sama, termasuk kunci API yang diwajibkan.

### Firecrawl yang dihosting sendiri

Atur `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl`, atau `FIRECRAWL_BASE_URL` saat Anda menjalankan Firecrawl sendiri. OpenClaw hanya menerima `http://` untuk target loopback, jaringan privat, `.local`, `.internal`, atau `.localhost`. Host khusus publik ditolak agar kunci API Firecrawl tidak terkirim secara tidak sengaja ke titik akhir sembarang.

## Alat Plugin Firecrawl

### `firecrawl_search`

Gunakan ini jika Anda menginginkan kontrol pencarian khusus Firecrawl, bukan `web_search` generik.

Parameter:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Gunakan ini untuk halaman yang sangat bergantung pada JS atau dilindungi dari bot, ketika `web_fetch` biasa kurang andal.

Parameter:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Penyamaran / pengelakan bot

`firecrawl_scrape` dan cadangan Firecrawl untuk `web_fetch` secara bawaan menggunakan `proxy: "auto"` beserta `storeInCache: true`, kecuali pemanggil mengganti parameter tersebut. `firecrawl_search` dan penyedia Firecrawl untuk `web_search` tidak memiliki kontrol `proxy`/`storeInCache`; mode proksi penyamaran hanya berlaku untuk permintaan pengikisan/pengambilan.

Mode `proxy` Firecrawl mengontrol pengelakan bot (`basic`, `stealth`, atau `auto`). `auto` mencoba kembali dengan proksi penyamaran jika upaya dasar gagal, yang mungkin menggunakan lebih banyak kredit dibandingkan pengikisan khusus mode dasar.

## Cara `web_fetch` menggunakan Firecrawl

Urutan ekstraksi `web_fetch`:

1. Readability (lokal)
2. Penyedia pengambilan yang dikonfigurasi, seperti Firecrawl (ketika dipilih atau terdeteksi secara otomatis dari kredensial yang dikonfigurasi)
3. Pembersihan HTML dasar (cadangan terakhir)

Pengaturan pemilihannya adalah `tools.web.fetch.provider`. Jika Anda tidak menyertakannya, OpenClaw mendeteksi secara otomatis penyedia pengambilan web siap pakai pertama berdasarkan kredensial yang tersedia. Plugin Firecrawl resmi menyediakan cadangan tersebut.

## Terkait

- [Ikhtisar Pencarian Web](/id/tools/web) -- semua penyedia dan deteksi otomatis
- [Pengambilan Web](/id/tools/web-fetch) -- alat web_fetch dengan cadangan Firecrawl
- [Tavily](/id/tools/tavily) -- alat pencarian + ekstraksi
