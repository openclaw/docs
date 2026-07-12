---
read_when:
    - Anda ingin mengambil URL dan mengekstrak konten yang mudah dibaca
    - Anda perlu mengonfigurasi web_fetch atau fallback Firecrawl-nya
    - Anda ingin memahami batasan dan penyimpanan cache web_fetch
sidebarTitle: Web Fetch
summary: alat web_fetch -- pengambilan HTTP dengan ekstraksi konten yang mudah dibaca
title: Pengambilan web
x-i18n:
    generated_at: "2026-07-12T14:48:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` melakukan HTTP GET biasa dan mengekstrak konten yang dapat dibaca (HTML menjadi
markdown atau teks). Alat ini **tidak** mengeksekusi JavaScript. Untuk situs yang banyak menggunakan JS atau
halaman yang dilindungi login, gunakan [Peramban Web](/id/tools/browser).

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
Potong keluaran hingga jumlah karakter ini. Dibatasi oleh `tools.web.fetch.maxCharsCap`.
</ParamField>

## Cara kerjanya

<Steps>
  <Step title="Pengambilan">
    Mengirim HTTP GET dengan User-Agent menyerupai Chrome dan header
    `Accept-Language`. Memblokir nama host privat/internal dan memeriksa ulang pengalihan.
  </Step>
  <Step title="Ekstraksi">
    Menjalankan Readability (ekstraksi konten utama) pada respons HTML.
  </Step>
  <Step title="Fallback (opsional)">
    Jika Readability gagal dan penyedia pengambilan tersedia, mencoba kembali melalui
    penyedia tersebut (misalnya mode pengelakan bot milik Firecrawl).
  </Step>
  <Step title="Cache">
    Hasil disimpan dalam cache selama 15 menit (dapat dikonfigurasi) untuk mengurangi
    pengambilan berulang atas URL yang sama.
  </Step>
</Steps>

## Pembaruan progres

`web_fetch` mengeluarkan baris progres publik hanya ketika pengambilan masih tertunda
setelah lima detik:

```text
Mengambil konten halaman...
```

Cache yang ditemukan dengan cepat dan respons jaringan yang cepat selesai sebelum pewaktu aktif, sehingga
tidak pernah menampilkan baris progres. Membatalkan panggilan akan menghapus pewaktu. Baris
progres hanya merupakan status UI kanal dan tidak pernah berisi konten halaman yang diambil.

## Konfigurasi

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // opsional; hilangkan untuk deteksi otomatis
        maxChars: 20000, // jumlah karakter keluaran default; dibatasi oleh maxCharsCap
        maxCharsCap: 20000, // batas mutlak untuk parameter maxChars
        maxResponseBytes: 750000, // ukuran unduhan maksimum sebelum pemotongan (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // izinkan proksi lingkungan HTTP(S) tepercaya me-resolve DNS
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

Jika ekstraksi Readability gagal, `web_fetch` dapat beralih ke
[Firecrawl](/id/tools/firecrawl) untuk mengelakkan bot dan menghasilkan ekstraksi yang lebih baik:

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
Konfigurasi lama `tools.web.fetch.firecrawl.*` dimigrasikan secara otomatis ke
`plugins.entries.firecrawl.config.webFetch` melalui `openclaw doctor --fix`.

<Note>
  Jika Anda mengonfigurasi SecretRef kunci API Firecrawl dan referensinya tidak dapat diselesaikan tanpa
  fallback variabel lingkungan `FIRECRAWL_API_KEY`, proses awal Gateway segera gagal.
</Note>

<Note>
  Penimpaan `baseUrl` Firecrawl dibatasi ketat: lalu lintas yang dihosting menggunakan
  `https://api.firecrawl.dev`; penimpaan yang dihosting sendiri harus menargetkan endpoint privat atau
  internal, dan `http://` hanya diterima untuk target privat tersebut.
</Note>

Perilaku runtime saat ini:

- `tools.web.fetch.provider` memilih penyedia fallback pengambilan secara eksplisit.
- Jika `provider` dihilangkan, OpenClaw otomatis mendeteksi penyedia pengambilan web pertama
  yang siap dari kredensial yang dikonfigurasi. `web_fetch` tanpa sandbox dapat menggunakan
  plugin terpasang yang mendeklarasikan `contracts.webFetchProviders` dan mendaftarkan
  penyedia yang sesuai saat runtime. Plugin Firecrawl resmi menyediakan
  fallback ini saat ini.
- Panggilan `web_fetch` dalam sandbox mengizinkan penyedia bawaan serta penyedia terpasang
  yang asal resminya dari npm atau ClawHub telah diverifikasi. Saat ini, hal tersebut mengizinkan
  plugin Firecrawl resmi; plugin pengambilan eksternal pihak ketiga tetap dikecualikan.
- Jika Readability dinonaktifkan, `web_fetch` langsung beralih ke fallback
  penyedia yang dipilih. Jika tidak ada penyedia yang tersedia, proses gagal secara tertutup.

## Proksi lingkungan tepercaya

Jika penerapan Anda mengharuskan `web_fetch` melewati proksi HTTP(S) keluar
yang tepercaya, atur `tools.web.fetch.useTrustedEnvProxy: true`.

Dalam mode ini, OpenClaw tetap menerapkan pemeriksaan SSRF berbasis nama host sebelum mengirim
permintaan, tetapi mengizinkan proksi me-resolve DNS alih-alih melakukan
penyematan DNS lokal. Aktifkan ini hanya jika proksi dikendalikan operator dan menerapkan
kebijakan keluar setelah resolusi DNS.

<Note>
  Jika tidak ada variabel lingkungan proksi HTTP(S) yang dikonfigurasi, atau host target dikecualikan oleh
  `NO_PROXY`, `web_fetch` kembali ke jalur ketat normal dengan penyematan DNS
  lokal.
</Note>

## Batas dan keamanan

- `maxChars` dibatasi oleh `tools.web.fetch.maxCharsCap` (default `20000`)
- Isi respons dibatasi hingga `maxResponseBytes` (default `750000`, dibatasi dalam rentang
  32000-10000000) sebelum penguraian; respons yang terlalu besar dipotong dengan peringatan
- Nama host privat/internal diblokir
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` dan
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` merupakan pilihan eksplisit yang terbatas
  untuk tumpukan proksi IP palsu tepercaya; biarkan tidak diatur kecuali proksi Anda mengelola
  rentang sintetis tersebut dan menerapkan kebijakan tujuannya sendiri
- Pengalihan diperiksa dan dibatasi oleh `maxRedirects` (default `3`)
- `useTrustedEnvProxy` merupakan pilihan eksplisit dan hanya boleh diaktifkan untuk
  proksi yang dikendalikan operator dan tetap menerapkan kebijakan keluar setelah resolusi
  DNS
- `web_fetch` bersifat upaya terbaik -- beberapa situs memerlukan [Peramban Web](/id/tools/browser)

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

- [Pencarian Web](/id/tools/web) -- telusuri web dengan beberapa penyedia
- [Peramban Web](/id/tools/browser) -- otomatisasi peramban lengkap untuk situs yang banyak menggunakan JS
- [Firecrawl](/id/tools/firecrawl) -- alat pencarian dan pengambilan data Firecrawl
