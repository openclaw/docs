---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang dapat dibaca
    - Anda perlu mengonfigurasi web_fetch atau mekanisme cadangan Firecrawl-nya
    - Anda ingin memahami batasan web_fetch dan penyimpanan cache
sidebarTitle: Web Fetch
summary: alat web_fetch -- pengambilan HTTP dengan ekstraksi konten yang dapat dibaca
title: Pengambilan web
x-i18n:
    generated_at: "2026-04-30T10:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Alat `web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang dapat dibaca
(HTML ke markdown atau teks). Alat ini **tidak** menjalankan JavaScript.

Untuk situs yang sangat bergantung pada JS atau halaman yang dilindungi login, gunakan
[Peramban Web](/id/tools/browser) sebagai gantinya.

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
Format keluaran setelah ekstraksi konten utama.
</ParamField>

<ParamField path="maxChars" type="number">
Potong keluaran hingga sejumlah karakter ini.
</ParamField>

## Cara kerjanya

<Steps>
  <Step title="Fetch">
    Mengirim HTTP GET dengan User-Agent mirip Chrome dan header
    `Accept-Language`. Memblokir hostname privat/internal dan memeriksa ulang pengalihan.
  </Step>
  <Step title="Extract">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (optional)">
    Jika Readability gagal dan Firecrawl dikonfigurasi, mencoba ulang melalui
    API Firecrawl dengan mode pengelakan bot.
  </Step>
  <Step title="Cache">
    Hasil di-cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi
    pengambilan berulang URL yang sama.
  </Step>
</Steps>

## Konfigurasi

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Fallback Firecrawl

Jika ekstraksi Readability gagal, `web_fetch` dapat melakukan fallback ke
[Firecrawl](/id/tools/firecrawl) untuk pengelakan bot dan ekstraksi yang lebih baik:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
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
  Jika Firecrawl diaktifkan dan SecretRef-nya tidak terselesaikan tanpa fallback env
  `FIRECRAWL_API_KEY`, startup Gateway akan cepat gagal.
</Note>

<Note>
  Override `baseUrl` Firecrawl dikunci ketat: harus menggunakan `https://` dan
  host resmi Firecrawl (`api.firecrawl.dev`).
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih penyedia fallback pengambilan secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw mendeteksi otomatis penyedia web-fetch
  pertama yang siap dari kredensial yang tersedia. Saat ini penyedia bawaan adalah Firecrawl.
- Jika Readability dinonaktifkan, `web_fetch` langsung melewati ke fallback
  penyedia yang dipilih. Jika tidak ada penyedia yang tersedia, proses gagal tertutup.

## Batas dan keamanan

- `maxChars` dibatasi ke `tools.web.fetch.maxCharsCap`
- Body respons dibatasi pada `maxResponseBytes` sebelum parsing; respons yang terlalu besar
  dipotong dengan peringatan
- Hostname privat/internal diblokir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` adalah opt-in sempit
  untuk stack proxy IP palsu tepercaya; biarkan tidak diatur kecuali proxy Anda memiliki
  rentang sintetis tersebut dan menerapkan kebijakan tujuan sendiri
- Pengalihan diperiksa dan dibatasi oleh `maxRedirects`
- `web_fetch` bersifat upaya terbaik -- beberapa situs memerlukan [Peramban Web](/id/tools/browser)

## Profil alat

Jika Anda menggunakan profil alat atau allowlist, tambahkan `web_fetch` atau `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Terkait

- [Pencarian Web](/id/tools/web) -- cari di web dengan beberapa penyedia
- [Peramban Web](/id/tools/browser) -- otomatisasi peramban penuh untuk situs yang sangat bergantung pada JS
- [Firecrawl](/id/tools/firecrawl) -- alat pencarian dan scrape Firecrawl
