---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang mudah dibaca
    - Anda perlu mengonfigurasi web_fetch atau fallback Firecrawl-nya
    - Anda ingin memahami batasan dan caching web_fetch
sidebarTitle: Web Fetch
summary: tool web_fetch -- HTTP fetch dengan ekstraksi konten yang mudah dibaca
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T14:09:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

Tool `web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang mudah dibaca
(HTML ke markdown atau teks). Tool ini **tidak** mengeksekusi JavaScript.

Untuk situs yang sangat bergantung pada JS atau halaman yang dilindungi login, gunakan
[Web Browser](/tools/browser) sebagai gantinya.

## Mulai cepat

`web_fetch` **aktif secara default** -- tidak perlu konfigurasi. Agen dapat
langsung memanggilnya:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parameter tool

| Parameter     | Tipe     | Deskripsi                                 |
| ------------- | -------- | ----------------------------------------- |
| `url`         | `string` | URL yang akan diambil (wajib, hanya http/https) |
| `extractMode` | `string` | `"markdown"` (default) atau `"text"`      |
| `maxChars`    | `number` | Potong output hingga sejumlah karakter ini |

## Cara kerjanya

<Steps>
  <Step title="Ambil">
    Mengirim HTTP GET dengan User-Agent mirip Chrome dan header `Accept-Language`.
    Memblokir hostname privat/internal dan memeriksa ulang redirect.
  </Step>
  <Step title="Ekstrak">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (opsional)">
    Jika Readability gagal dan Firecrawl telah dikonfigurasi, coba lagi melalui
    API Firecrawl dengan mode penghindaran bot.
  </Step>
  <Step title="Cache">
    Hasil di-cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi
    pengambilan berulang pada URL yang sama.
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
        maxCharsCap: 50000, // batas keras untuk parameter maxChars
        maxResponseBytes: 2000000, // ukuran unduhan maksimum sebelum dipotong
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // gunakan ekstraksi Readability
        userAgent: "Mozilla/5.0 ...", // override User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Jika ekstraksi Readability gagal, `web_fetch` dapat menggunakan fallback ke
[Firecrawl](/tools/firecrawl) untuk penghindaran bot dan ekstraksi yang lebih baik:

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

`plugins.entries.firecrawl.config.webFetch.apiKey` mendukung objek SecretRef.
Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.

<Note>
  Jika Firecrawl diaktifkan dan SecretRef-nya tidak terurai tanpa
  fallback env `FIRECRAWL_API_KEY`, startup gateway akan gagal dengan cepat.
</Note>

<Note>
  Override `baseUrl` Firecrawl dikunci ketat: harus menggunakan `https://` dan
  host Firecrawl resmi (`api.firecrawl.dev`).
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih penyedia fallback fetch secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw mendeteksi otomatis penyedia web-fetch
  siap pertama dari kredensial yang tersedia. Saat ini penyedia bawaannya adalah Firecrawl.
- Jika Readability dinonaktifkan, `web_fetch` langsung melewati ke fallback
  penyedia yang dipilih. Jika tidak ada penyedia yang tersedia, ia gagal tertutup.

## Batasan dan keamanan

- `maxChars` dibatasi ke `tools.web.fetch.maxCharsCap`
- Isi respons dibatasi pada `maxResponseBytes` sebelum parsing; respons yang terlalu besar
  akan dipotong dengan peringatan
- Hostname privat/internal diblokir
- Redirect diperiksa dan dibatasi oleh `maxRedirects`
- `web_fetch` bersifat best-effort -- beberapa situs memerlukan [Web Browser](/tools/browser)

## Profil tool

Jika Anda menggunakan profil tool atau allowlist, tambahkan `web_fetch` atau `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // atau: allow: ["group:web"]  (mencakup web_fetch, web_search, dan x_search)
  },
}
```

## Terkait

- [Web Search](/tools/web) -- telusuri web dengan beberapa penyedia
- [Web Browser](/tools/browser) -- otomatisasi browser penuh untuk situs yang sangat bergantung pada JS
- [Firecrawl](/tools/firecrawl) -- tool pencarian dan scraping Firecrawl
