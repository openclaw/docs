---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang mudah dibaca
    - Anda perlu mengonfigurasi `web_fetch` atau fallback Firecrawl-nya
    - Anda ingin memahami batasan dan caching `web_fetch`
sidebarTitle: Web Fetch
summary: alat `web_fetch` -- fetch HTTP dengan ekstraksi konten yang mudah dibaca
title: Web fetch
x-i18n:
    generated_at: "2026-04-24T09:33:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

Alat `web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang mudah dibaca
(HTML ke markdown atau teks). Ini **tidak** mengeksekusi JavaScript.

Untuk situs dengan JS berat atau halaman yang dilindungi login, gunakan
[Web Browser](/id/tools/browser) sebagai gantinya.

## Mulai cepat

`web_fetch` **diaktifkan secara default** -- tidak perlu konfigurasi. Agen dapat
langsung memanggilnya:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parameter alat

<ParamField path="url" type="string" required>
URL yang akan diambil. Hanya `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format output setelah ekstraksi konten utama.
</ParamField>

<ParamField path="maxChars" type="number">
Potong output hingga jumlah karakter ini.
</ParamField>

## Cara kerjanya

<Steps>
  <Step title="Fetch">
    Mengirim HTTP GET dengan User-Agent bergaya Chrome dan header `Accept-Language`.
    Memblokir hostname privat/internal dan memeriksa ulang redirect.
  </Step>
  <Step title="Ekstrak">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (opsional)">
    Jika Readability gagal dan Firecrawl dikonfigurasi, akan mencoba ulang melalui
    API Firecrawl dengan mode penghindaran bot.
  </Step>
  <Step title="Cache">
    Hasil di-cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi fetch
    berulang pada URL yang sama.
  </Step>
</Steps>

## Konfigurasi

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
        maxChars: 50000, // jumlah karakter output maksimum
        maxCharsCap: 50000, // batas keras untuk param maxChars
        maxResponseBytes: 2000000, // ukuran unduhan maksimum sebelum pemotongan
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // gunakan ekstraksi Readability
        userAgent: "Mozilla/5.0 ...", // ganti User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Jika ekstraksi Readability gagal, `web_fetch` dapat fallback ke
[Firecrawl](/id/tools/firecrawl) untuk penghindaran bot dan ekstraksi yang lebih baik:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis dari kredensial yang tersedia
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // opsional jika FIRECRAWL_API_KEY ditetapkan
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // durasi cache (1 hari)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` mendukung object SecretRef.
Konfigurasi legacy `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.

<Note>
  Jika Firecrawl diaktifkan dan SecretRef-nya belum ter-resolve tanpa
  fallback env `FIRECRAWL_API_KEY`, startup gateway akan gagal cepat.
</Note>

<Note>
  Penggantian `baseUrl` Firecrawl dikunci: harus menggunakan `https://` dan
  host Firecrawl resmi (`api.firecrawl.dev`).
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih provider fallback fetch secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw mendeteksi otomatis provider web-fetch pertama
  yang siap dari kredensial yang tersedia. Saat ini provider bawaan adalah Firecrawl.
- Jika Readability dinonaktifkan, `web_fetch` langsung melewati ke fallback provider
  yang dipilih. Jika tidak ada provider yang tersedia, akan gagal tertutup.

## Batasan dan keamanan

- `maxChars` dibatasi ke `tools.web.fetch.maxCharsCap`
- Body respons dibatasi ke `maxResponseBytes` sebelum parsing; respons yang terlalu besar
  dipotong dengan peringatan
- Hostname privat/internal diblokir
- Redirect diperiksa dan dibatasi oleh `maxRedirects`
- `web_fetch` bersifat best-effort -- beberapa situs memerlukan [Web Browser](/id/tools/browser)

## Profil alat

Jika Anda menggunakan profil alat atau allowlist, tambahkan `web_fetch` atau `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // atau: allow: ["group:web"]  (mencakup web_fetch, web_search, dan x_search)
  },
}
```

## Terkait

- [Web Search](/id/tools/web) -- telusuri web dengan banyak provider
- [Web Browser](/id/tools/browser) -- otomatisasi browser penuh untuk situs dengan JS berat
- [Firecrawl](/id/tools/firecrawl) -- alat pencarian dan scrape Firecrawl
