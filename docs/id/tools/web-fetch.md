---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang mudah dibaca
    - Anda perlu mengonfigurasi web_fetch atau fallback Firecrawl-nya
    - Anda ingin memahami batasan dan penembolokan web_fetch
sidebarTitle: Web Fetch
summary: web_fetch tool -- pengambilan HTTP dengan ekstraksi konten yang dapat dibaca
title: Pengambilan web
x-i18n:
    generated_at: "2026-06-27T18:23:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Alat `web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang dapat dibaca
(HTML ke markdown atau teks). Alat ini **tidak** menjalankan JavaScript.

Untuk situs yang sangat bergantung pada JS atau halaman yang dilindungi login, gunakan
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
Potong output hingga sebanyak karakter ini.
</ParamField>

## Cara kerjanya

<Steps>
  <Step title="Ambil">
    Mengirim HTTP GET dengan User-Agent mirip Chrome dan header
    `Accept-Language`. Memblokir hostname privat/internal dan memeriksa ulang pengalihan.
  </Step>
  <Step title="Ekstrak">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (opsional)">
    Jika Readability gagal dan Firecrawl dipilih, mencoba lagi melalui
    API Firecrawl dengan mode penghindaran bot.
  </Step>
  <Step title="Cache">
    Hasil di-cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi
    pengambilan berulang pada URL yang sama.
  </Step>
</Steps>

## Pembaruan progres

`web_fetch` memancarkan baris progres publik hanya ketika pengambilan masih tertunda
setelah lima detik:

```text
Fetching page content...
```

Cache hit cepat dan respons jaringan cepat selesai sebelum timer berjalan, sehingga
tidak menampilkan baris progres. Jika panggilan dibatalkan, timer dibersihkan.
Ketika pengambilan akhirnya selesai, agen menerima hasil alat normal;
baris progres hanya status UI kanal dan tidak pernah berisi konten halaman yang
diambil.

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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Jika ekstraksi Readability gagal, `web_fetch` dapat fallback ke
[Firecrawl](/id/tools/firecrawl) untuk penghindaran bot dan ekstraksi yang lebih baik:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` bersifat opsional dan mendukung objek SecretRef.
Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis oleh `openclaw doctor --fix`.

<Note>
  Jika Anda mengonfigurasi SecretRef kunci API Firecrawl dan tidak terselesaikan tanpa
  fallback env `FIRECRAWL_API_KEY`, startup gateway gagal cepat.
</Note>

<Note>
  Override `baseUrl` Firecrawl dikunci ketat: traffic hosted menggunakan
  `https://api.firecrawl.dev`; override self-hosted harus menargetkan endpoint privat atau
  internal, dan `http://` diterima hanya untuk target privat tersebut.
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih penyedia fallback pengambilan secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw mendeteksi otomatis penyedia web-fetch siap pertama
  dari kredensial yang dikonfigurasi. `web_fetch` non-sandbox dapat menggunakan
  Plugin terpasang yang mendeklarasikan `contracts.webFetchProviders` dan mendaftarkan
  penyedia yang cocok saat runtime. Plugin Firecrawl resmi menyediakan
  fallback ini.
- Panggilan `web_fetch` tersandbox mengizinkan penyedia bawaan serta penyedia terpasang
  yang asal-usul npm resmi atau ClawHub-nya terverifikasi. Saat ini itu mengizinkan
  Plugin Firecrawl resmi; Plugin pengambilan eksternal pihak ketiga tetap dikecualikan.
- Jika Readability dinonaktifkan, `web_fetch` langsung melewati ke fallback
  penyedia yang dipilih. Jika tidak ada penyedia yang tersedia, panggilan gagal tertutup.

## Proxy env tepercaya

Jika deployment Anda mengharuskan `web_fetch` melalui proxy outbound
HTTP(S) tepercaya, setel `tools.web.fetch.useTrustedEnvProxy: true`.

Dalam mode ini, OpenClaw tetap menerapkan pemeriksaan SSRF berbasis hostname sebelum mengirim
permintaan, tetapi membiarkan proxy menyelesaikan DNS alih-alih melakukan
pinning DNS lokal. Aktifkan ini hanya ketika proxy dikendalikan operator dan menegakkan
kebijakan outbound setelah resolusi DNS.

<Note>
  Jika tidak ada variabel env proxy HTTP(S) yang dikonfigurasi, atau host target dikecualikan oleh
  `NO_PROXY`, `web_fetch` fallback ke jalur ketat normal dengan pinning DNS
  lokal.
</Note>

## Batas dan keamanan

- `maxChars` dibatasi ke `tools.web.fetch.maxCharsCap`
- Body respons dibatasi pada `maxResponseBytes` sebelum parsing; respons yang terlalu besar
  dipotong dengan peringatan
- Hostname privat/internal diblokir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` adalah opt-in sempit
  untuk stack proxy fake-IP tepercaya; biarkan tidak disetel kecuali proxy Anda memiliki
  rentang sintetis tersebut dan menegakkan kebijakan tujuannya sendiri
- Pengalihan diperiksa dan dibatasi oleh `maxRedirects`
- `useTrustedEnvProxy` adalah opt-in eksplisit dan hanya boleh diaktifkan untuk
  proxy yang dikendalikan operator yang tetap menegakkan kebijakan outbound setelah resolusi
  DNS
- `web_fetch` bersifat upaya terbaik -- beberapa situs memerlukan [Web Browser](/id/tools/browser)

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

- [Web Search](/id/tools/web) -- cari di web dengan beberapa penyedia
- [Web Browser](/id/tools/browser) -- otomatisasi browser penuh untuk situs yang sangat bergantung pada JS
- [Firecrawl](/id/tools/firecrawl) -- alat pencarian dan scraping Firecrawl
