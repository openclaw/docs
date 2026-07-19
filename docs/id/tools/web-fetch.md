---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang mudah dibaca
    - Anda perlu mengonfigurasi web_fetch atau fallback Firecrawl-nya
    - Anda ingin memahami batas dan caching web_fetch
sidebarTitle: Web Fetch
summary: alat web_fetch -- pengambilan HTTP dengan ekstraksi konten yang mudah dibaca
title: Pengambilan web
x-i18n:
    generated_at: "2026-07-19T05:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddf312245064672dcf489e8714740fa3e034827e16b33be8fb6a87db04f19ef8
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang dapat dibaca (HTML menjadi
markdown atau teks). Ini **tidak** menjalankan JavaScript. Untuk situs yang sangat bergantung pada JS atau
halaman yang dilindungi login, gunakan [Browser Web](/id/tools/browser) sebagai gantinya.

## Mulai cepat

Diaktifkan secara default, tidak memerlukan konfigurasi:

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
Pangkas keluaran hingga sejumlah karakter ini. Dibatasi hingga `tools.web.fetch.maxCharsCap`.
</ParamField>

## Hasil

`web_fetch` mengembalikan hasil terstruktur tertutup dengan bidang-bidang berikut:

- Metadata permintaan: `url`, `finalUrl`, `status`, `extractMode`, dan `extractor`
- Metadata respons opsional: `contentType`, `title`, dan `warning` (dihilangkan jika tidak ada)
- Metadata konten terbungkus: `externalContent`, `truncated`, `length`, `rawLength`,
  `fetchedAt`, `tookMs`, dan `text`
- `cached: true` opsional saat cache ditemukan
- `spill: { path, chars, truncated? }` opsional ketika konten yang dipangkas ditulis
  ke berkas sementara privat; `truncated` hanya tersedia ketika berkas tersebut berisi
  sebagian konten sumber

`length` adalah panjang `text` yang terbungkus. `rawLength` adalah panjang konten yang diekstrak
sebelum pembungkusan konten eksternal.

## Cara kerjanya

<Steps>
  <Step title="Ambil">
    Mengirim HTTP GET dengan User-Agent menyerupai Chrome dan header `Accept-Language`.
    Memblokir nama host privat/internal dan memeriksa ulang pengalihan.
  </Step>
  <Step title="Ekstrak">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (opsional)">
    Jika Readability gagal dan penyedia pengambilan tersedia, mencoba kembali melalui
    penyedia tersebut (misalnya mode pengelakan bot Firecrawl).
  </Step>
  <Step title="Cache">
    Hasil disimpan dalam cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi
    pengambilan berulang URL yang sama.
  </Step>
</Steps>

## Pembaruan progres

`web_fetch` memancarkan baris progres publik hanya ketika pengambilan masih tertunda
setelah lima detik:

```text
Mengambil konten halaman...
```

Cache yang ditemukan dengan cepat dan respons jaringan yang cepat selesai sebelum pewaktu terpicu, sehingga
tidak pernah menampilkan baris progres. Membatalkan panggilan akan menghapus pewaktu. Baris
progres hanyalah status UI kanal dan tidak pernah memuat konten halaman yang diambil.

## Konfigurasi

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
        maxChars: 20000, // karakter keluaran default; dibatasi oleh maxCharsCap
        maxCharsCap: 20000, // batas mutlak untuk parameter maxChars
        maxResponseBytes: 750000, // ukuran unduhan maksimum sebelum pemangkasan (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // izinkan proksi lingkungan HTTP(S) tepercaya menyelesaikan DNS
        readability: true, // gunakan ekstraksi Readability
        userAgent: "Mozilla/5.0 ...", // timpa User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // pilihan eksplisit untuk proksi IP palsu tepercaya yang menggunakan 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // pilihan eksplisit untuk proksi IP palsu tepercaya yang menggunakan fc00::/7
        },
      },
    },
  },
}
```

## Fallback Firecrawl

Jika ekstraksi Readability gagal, `web_fetch` dapat menggunakan
[Firecrawl](/id/tools/firecrawl) sebagai fallback untuk pengelakan bot dan ekstraksi yang lebih baik:

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
            // apiKey: "fc-...", // opsional; hilangkan untuk akses awal tanpa kunci
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // durasi cache (2 hari)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` bersifat opsional dan mendukung objek SecretRef.
Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan otomatis ke
`plugins.entries.firecrawl.config.webFetch` melalui `openclaw doctor --fix`.

<Note>
  Jika Anda mengonfigurasi SecretRef kunci API Firecrawl dan referensi tersebut tidak terselesaikan tanpa
  fallback lingkungan `FIRECRAWL_API_KEY`, proses mulai Gateway langsung gagal.
</Note>

<Note>
  Penimpaan `baseUrl` Firecrawl dibatasi secara ketat: lalu lintas terkelola menggunakan
  `https://api.firecrawl.dev`; penimpaan yang dihosting sendiri harus menargetkan endpoint privat atau
  internal, dan `http://` hanya diterima untuk target privat tersebut.
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih penyedia fallback pengambilan secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw secara otomatis mendeteksi penyedia pengambilan web siap pakai pertama
  dari kredensial yang dikonfigurasi. `web_fetch` tanpa sandbox dapat menggunakan
  plugin terinstal yang mendeklarasikan `contracts.webFetchProviders` dan mendaftarkan
  penyedia yang cocok saat runtime. Plugin Firecrawl resmi menyediakan
  fallback ini saat ini.
- Panggilan `web_fetch` dalam sandbox mengizinkan penyedia bawaan serta penyedia terinstal
  yang asal resmi npm atau ClawHub-nya telah diverifikasi. Saat ini, ini mengizinkan
  plugin Firecrawl resmi; plugin pengambilan eksternal pihak ketiga tetap dikecualikan.
- Jika Readability dinonaktifkan, `web_fetch` langsung beralih ke
  fallback penyedia yang dipilih. Jika tidak ada penyedia yang tersedia, operasi gagal secara tertutup.

## Proksi lingkungan tepercaya

Jika deployment Anda mengharuskan `web_fetch` melalui proksi HTTP(S)
keluar yang tepercaya, tetapkan `tools.web.fetch.useTrustedEnvProxy: true`.

Dalam mode ini, OpenClaw tetap menerapkan pemeriksaan SSRF berbasis nama host sebelum mengirim
permintaan, tetapi mengizinkan proksi menyelesaikan DNS alih-alih melakukan penyematan DNS
lokal. Aktifkan ini hanya jika proksi dikendalikan operator dan memberlakukan
kebijakan keluar setelah resolusi DNS.

<Note>
  Jika tidak ada variabel lingkungan proksi HTTP(S) yang dikonfigurasi, atau host target dikecualikan oleh
  `NO_PROXY`, `web_fetch` kembali ke jalur ketat normal dengan penyematan DNS
  lokal.
</Note>

## Batas dan keamanan

- `maxChars` dibatasi hingga `tools.web.fetch.maxCharsCap` (default `20000`)
- Isi respons dibatasi hingga `maxResponseBytes` (default `750000`, dibatasi dalam rentang
  32000-10000000) sebelum penguraian; respons yang terlalu besar dipangkas dengan peringatan
- Nama host privat/internal diblokir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` adalah pilihan eksplisit terbatas
  untuk tumpukan proksi IP palsu tepercaya; biarkan tidak ditetapkan kecuali proksi Anda memiliki
  rentang sintetis tersebut dan memberlakukan kebijakan tujuannya sendiri
- Pengalihan diperiksa dan dibatasi oleh `maxRedirects` (default `3`)
- `useTrustedEnvProxy` adalah pilihan eksplisit dan hanya boleh diaktifkan untuk
  proksi yang dikendalikan operator yang tetap memberlakukan kebijakan keluar setelah resolusi
  DNS
- `web_fetch` bersifat upaya terbaik -- beberapa situs memerlukan [Browser Web](/id/tools/browser)

## Profil alat

Jika Anda menggunakan profil alat atau daftar izin, tambahkan `web_fetch` atau `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // atau: allow: ["group:web"]  (mencakup web_fetch, web_search, dan x_search)
  },
}
```

## Terkait

- [Pencarian Web](/id/tools/web) -- cari web dengan beberapa penyedia
- [Browser Web](/id/tools/browser) -- otomatisasi browser lengkap untuk situs yang sangat bergantung pada JS
- [Firecrawl](/id/tools/firecrawl) -- alat pencarian dan scraping Firecrawl
