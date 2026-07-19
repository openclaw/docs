---
read_when:
    - Mengerjakan fitur atau webhook Zalo
summary: Status dukungan, kemampuan, dan konfigurasi bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-19T04:58:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f3e0bfe6003d3b2f38411fcc5a4e82266733b042693c7853d0b3c8a3864273c5
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperimental. Pesan langsung dan obrolan grup telah diimplementasikan; tabel [Kemampuan](#capabilities) di bawah mencerminkan perilaku yang telah diverifikasi pada bot Zalo Bot Creator / Marketplace.

## Plugin bawaan

Zalo disertakan sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga build terpaket tidak memerlukan instalasi terpisah.

Pada build lama atau instalasi khusus yang tidak menyertakan Zalo, instal paket npm secara langsung:

- Instal: `openclaw plugins install @openclaw/zalo`
- Versi yang disematkan: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Dari checkout lokal: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Buat token bot di [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (masuk, buat bot, konfigurasikan pengaturan). Token tersebut adalah `numeric_id:secret`; untuk bot Marketplace, token runtime yang dapat digunakan mungkin muncul dalam pesan sambutan bot.
2. Tetapkan token, baik sebagai env `ZALO_BOT_TOKEN=...` (hanya akun default) maupun dalam konfigurasi.
3. Mulai ulang Gateway.
4. Setujui kode pemasangan saat kontak DM pertama (kebijakan DM default adalah pemasangan).

Konfigurasi minimal:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Multiakun: tambahkan entri lainnya di bawah `channels.zalo.accounts.<id>`, masing-masing dengan `botToken`/`name` sendiri. `channels.zalo.botToken` (datar, tanpa `accounts`) adalah bentuk singkat akun tunggal lama; utamakan `accounts.<id>.*` untuk konfigurasi baru.

## Apa itu Zalo

Zalo adalah aplikasi perpesanan yang berfokus pada Vietnam. Bot API-nya memungkinkan Gateway menjalankan bot untuk percakapan 1:1 dan obrolan grup, dengan perutean deterministik kembali ke Zalo (model tidak pernah memilih saluran).

Halaman ini membahas **bot Zalo Bot Creator / Marketplace**. **Bot Zalo Official Account (OA)** merupakan permukaan produk yang berbeda dan mungkin berperilaku berbeda; halaman ini tidak membahasnya.

## Cara kerjanya

- Pesan masuk dinormalisasi ke dalam amplop saluran bersama dengan placeholder media.
- Balasan selalu dirutekan kembali ke obrolan Zalo yang sama; balasan kutipan tidak digunakan (`replyToMode` selalu dinonaktifkan).
- Long-polling (`getUpdates`) digunakan secara default; mode webhook tersedia melalui `channels.zalo.webhookUrl`.
- Grup memerlukan @mention untuk memicu bot; hal ini tidak dapat dikonfigurasi per saluran.

## Batas

| Batas                         | Nilai                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ |
| Ukuran potongan teks keluar   | 2000 karakter (batas API Zalo)                                           |
| Ukuran media (masuk/keluar)   | `channels.zalo.mediaMaxMb`, default `5` MB                               |
| Isi permintaan webhook        | 1 MB, batas waktu baca 30s                                                |
| Batas laju webhook            | 120 permintaan / 60s per jalur+IP klien, lalu HTTP 429                    |
| Tombstone pemutaran ulang webhook | 30 hari, hingga 20.000 peristiwa selesai per akun (dikunci berdasarkan ID pesan) |

## Kontrol akses

### Pesan langsung

- `channels.zalo.dmPolicy`: `pairing` (default) | `allowlist` | `open` | `disabled`.
- Pemasangan: pengirim yang tidak dikenal menerima kode pemasangan; pesan diabaikan sampai disetujui. Kode kedaluwarsa setelah 1 jam.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detail: [Pemasangan](/id/channels/pairing)
- `channels.zalo.allowFrom` menerima ID pengguna Zalo numerik (tanpa pencarian nama pengguna). `open` memerlukan `"*"`.

### Grup

Obrolan grup didukung oleh plugin (`chatTypes: ["direct", "group"]`) dan dibatasi oleh mention serta kebijakan grup:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` membatasi ID pengirim yang dapat memicu bot dalam grup; kembali menggunakan `allowFrom` jika tidak ditetapkan.
- Resolusi default: ketika `channels.zalo` dikonfigurasi, `groupPolicy` yang tidak ditetapkan diselesaikan menjadi `open`. Ketika `channels.zalo` tidak ada sama sekali, runtime ditutup secara aman ke `allowlist`.
- Peringatan berdasarkan laporan penggunaan nyata: pada beberapa penyiapan bot Marketplace, bot sama sekali tidak dapat ditambahkan ke grup. Jika Anda mengalami hal tersebut, verifikasikan melalui pengaturan Zalo Bot Platform untuk bot Anda; ini merupakan batasan dari sisi platform, bukan kebijakan OpenClaw.

## Long-polling dibandingkan webhook

- Default: long-polling (tidak memerlukan URL publik).
- Mode webhook: tetapkan `channels.zalo.webhookUrl` dan `channels.zalo.webhookSecret`.
  - URL webhook harus menggunakan HTTPS.
  - Rahasia webhook harus terdiri dari 8-256 karakter.
  - Zalo mengirim peristiwa dengan header `X-Bot-Api-Secret-Token`, yang diperiksa menggunakan perbandingan waktu konstan.
  - HTTP Gateway menangani permintaan webhook di `channels.zalo.webhookPath` (secara default menggunakan jalur URL webhook).
  - Permintaan harus menggunakan `Content-Type: application/json` (atau jenis media `+json`).
  - HTTP 200 hanya dikembalikan setelah peristiwa mentah disimpan secara persisten; kegagalan penyimpanan mengembalikan HTTP 500.
  - Polling getUpdates dan webhook saling eksklusif menurut dokumentasi API Zalo.

## Jenis pesan yang didukung

- Teks: dukungan penuh, dibagi menjadi potongan 2000 karakter.
- Media: masuk/keluar, dibatasi oleh `mediaMaxMb`.
- Reaksi, utas, jajak pendapat, perintah native: tidak didukung oleh plugin.
- Streaming: plugin mendeklarasikan kemampuan block-streaming, tetapi Zalo tidak memiliki opsi khusus untuk penyesuaian antrean keluar/penggabungan teks (berbeda dengan beberapa saluran regional lainnya); verifikasikan perilaku saat ini di lingkungan Anda jika hal ini penting bagi kasus penggunaan Anda.

## Kemampuan

| Fitur                    | Status                                  |
| ------------------------ | --------------------------------------- |
| Pesan langsung           | Didukung                                |
| Grup                     | Didukung (dibatasi oleh mention)        |
| Media (masuk/keluar)     | Didukung, dibatasi oleh `mediaMaxMb` |
| Reaksi                   | Tidak didukung                          |
| Utas                     | Tidak didukung                          |
| Jajak pendapat           | Tidak didukung                          |
| Perintah native          | Tidak didukung                          |
| Balas-ke / kutipan       | Tidak digunakan (selalu dinonaktifkan)  |

## Target pengiriman (CLI/cron)

Gunakan ID obrolan sebagai target:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Pemecahan masalah

**Bot tidak merespons:**

- Periksa token: `openclaw channels status --probe`
- Pastikan pengirim telah disetujui (pemasangan atau `allowFrom`)
- Periksa log Gateway: `openclaw logs --follow`

**Webhook tidak menerima peristiwa:**

- Pastikan URL webhook menggunakan HTTPS
- Pastikan rahasia terdiri dari 8-256 karakter
- Pastikan endpoint HTTP Gateway dapat dijangkau pada jalur yang dikonfigurasi
- Pastikan polling getUpdates tidak berjalan secara bersamaan (keduanya saling eksklusif)
- Lonjakan permintaan dapat menghasilkan HTTP 429 (120 permintaan / 60s per jalur+IP); tunggu dan coba lagi

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

| Pengaturan                                   | Deskripsi                                         | Default               |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Aktifkan/nonaktifkan proses awal saluran          | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Token bot dari Zalo Bot Platform                  | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Baca token dari berkas (symlink ditolak)          | -                     |
| `channels.zalo.accounts.<id>.name`           | Nama tampilan                                     | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Aktifkan/nonaktifkan akun ini                     | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Kebijakan DM per akun                             | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Daftar izin DM (ID pengguna)                      | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | Kebijakan grup per akun                           | lihat [Grup](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Daftar izin pengirim grup; kembali menggunakan `allowFrom` | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Batas media masuk/keluar (MB)                     | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Aktifkan mode webhook (HTTPS diperlukan)          | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Rahasia webhook (8-256 karakter)                  | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Jalur webhook pada server HTTP Gateway            | jalur URL webhook     |
| `channels.zalo.accounts.<id>.proxy`          | URL proxy untuk permintaan API                    | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Penimpaan prefiks respons keluar                  | -                     |
| `channels.zalo.defaultAccount`               | Akun default ketika beberapa akun dikonfigurasi   | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy`, dan kunci tingkat atas datar lainnya merupakan bentuk singkat akun tunggal lama untuk bidang di atas; kedua bentuk didukung.

Opsi env: `ZALO_BOT_TOKEN=...` hanya menyelesaikan token akun default.

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
