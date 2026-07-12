---
read_when:
    - Mengerjakan fitur atau webhook Zalo
summary: Status dukungan, kemampuan, dan konfigurasi bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T14:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperimental. Pesan langsung dan obrolan grup telah diimplementasikan; tabel [Kemampuan](#capabilities) di bawah mencerminkan perilaku yang telah diverifikasi pada bot Zalo Bot Creator / Marketplace.

## Plugin bawaan

Zalo disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build terpaket tidak memerlukan instalasi terpisah.

Pada build lama atau instalasi khusus yang tidak menyertakan Zalo, instal paket npm secara langsung:

- Instal: `openclaw plugins install @openclaw/zalo`
- Versi yang dipatok: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Dari checkout lokal: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Buat token bot di [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (masuk, buat bot, konfigurasikan pengaturan). Format token adalah `numeric_id:secret`; untuk bot Marketplace, token runtime yang dapat digunakan mungkin muncul dalam pesan sambutan bot.
2. Tetapkan token, baik sebagai env `ZALO_BOT_TOKEN=...` (hanya akun bawaan) maupun dalam konfigurasi.
3. Mulai ulang Gateway.
4. Setujui kode pemasangan saat kontak pesan langsung pertama (kebijakan pesan langsung bawaan adalah pemasangan).

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

Multiakun: tambahkan entri lain di bawah `channels.zalo.accounts.<id>`, masing-masing dengan `botToken`/`name` sendiri. `channels.zalo.botToken` (datar, tanpa `accounts`) adalah bentuk singkat akun tunggal lama; utamakan `accounts.<id>.*` untuk konfigurasi baru.

## Apa itu Zalo

Zalo adalah aplikasi perpesanan yang berfokus pada Vietnam. API Bot-nya memungkinkan Gateway menjalankan bot untuk percakapan 1:1 maupun obrolan grup, dengan perutean deterministik kembali ke Zalo (model tidak pernah memilih saluran).

Halaman ini membahas **bot Zalo Bot Creator / Marketplace**. **Bot Zalo Official Account (OA)** merupakan permukaan produk yang berbeda dan mungkin berperilaku berbeda; halaman ini tidak membahasnya.

## Cara kerjanya

- Pesan masuk dinormalisasi ke dalam amplop saluran bersama dengan placeholder media.
- Balasan selalu dirutekan kembali ke obrolan Zalo yang sama; balasan kutipan tidak digunakan (`replyToMode` selalu dinonaktifkan).
- Long-polling (`getUpdates`) digunakan secara bawaan; mode Webhook tersedia melalui `channels.zalo.webhookUrl`.
- Grup memerlukan @mention untuk memicu bot; ini tidak dapat dikonfigurasi per saluran.

## Batas

| Batas                          | Nilai                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Ukuran potongan teks keluar    | 2000 karakter (batas API Zalo)                                                |
| Ukuran media (masuk/keluar)    | `channels.zalo.mediaMaxMb`, bawaan `5` MB                                     |
| Isi permintaan Webhook         | 1 MB, batas waktu baca 30 detik                                               |
| Batas laju Webhook             | 120 permintaan / 60 detik per jalur+IP klien, lalu HTTP 429                   |
| Jendela kejadian duplikat Webhook | 5 menit (berdasarkan jalur + akun + nama kejadian + obrolan + pengirim + ID pesan) |

## Kontrol akses

### Pesan langsung

- `channels.zalo.dmPolicy`: `pairing` (bawaan) | `allowlist` | `open` | `disabled`.
- Pemasangan: pengirim yang tidak dikenal menerima kode pemasangan; pesan diabaikan hingga disetujui. Kode kedaluwarsa setelah 1 jam.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Detail: [Pemasangan](/id/channels/pairing)
- `channels.zalo.allowFrom` menerima ID pengguna Zalo numerik (tanpa pencarian nama pengguna). `open` memerlukan `"*"`.

### Grup

Obrolan grup didukung oleh Plugin (`chatTypes: ["direct", "group"]`) dan dibatasi oleh mention serta kebijakan grup:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` membatasi ID pengirim yang dapat memicu bot dalam grup; kembali menggunakan `allowFrom` jika tidak ditetapkan.
- Resolusi bawaan: ketika `channels.zalo` dikonfigurasi, `groupPolicy` yang tidak ditetapkan ditetapkan menjadi `open`. Ketika `channels.zalo` sama sekali tidak ada, runtime menutup akses secara aman dengan `allowlist`.
- Catatan berdasarkan penggunaan nyata: pada beberapa penyiapan bot Marketplace, bot sama sekali tidak dapat ditambahkan ke grup. Jika Anda mengalaminya, verifikasi melalui pengaturan Zalo Bot Platform milik bot Anda; ini adalah batasan dari sisi platform, bukan kebijakan OpenClaw.

## Long-polling dibandingkan dengan Webhook

- Bawaan: long-polling (tidak memerlukan URL publik).
- Mode Webhook: tetapkan `channels.zalo.webhookUrl` dan `channels.zalo.webhookSecret`.
  - URL Webhook harus menggunakan HTTPS.
  - Rahasia Webhook harus terdiri dari 8-256 karakter.
  - Zalo mengirim kejadian dengan header `X-Bot-Api-Secret-Token`, yang diperiksa menggunakan perbandingan waktu konstan.
  - HTTP Gateway menangani permintaan Webhook pada `channels.zalo.webhookPath` (secara bawaan menggunakan jalur URL Webhook).
  - Permintaan harus menggunakan `Content-Type: application/json` (atau jenis media `+json`).
  - Polling getUpdates dan Webhook saling eksklusif menurut dokumentasi API Zalo.

## Jenis pesan yang didukung

- Teks: dukungan penuh, dipecah menjadi potongan 2000 karakter.
- Media: masuk/keluar, dibatasi oleh `mediaMaxMb`.
- Reaksi, utas, jajak pendapat, perintah native: tidak didukung oleh Plugin.
- Streaming: Plugin menyatakan kemampuan streaming blok, tetapi Zalo tidak memiliki opsi khusus untuk penyetelan antrean keluar/penggabungan teks (tidak seperti beberapa saluran regional lainnya); verifikasi perilaku saat ini di lingkungan Anda jika hal ini penting bagi kasus penggunaan Anda.

## Kemampuan

| Fitur                    | Status                                      |
| ------------------------ | ------------------------------------------- |
| Pesan langsung           | Didukung                                    |
| Grup                     | Didukung (memerlukan mention)               |
| Media (masuk/keluar)     | Didukung, dibatasi oleh `mediaMaxMb`        |
| Reaksi                   | Tidak didukung                              |
| Utas                     | Tidak didukung                              |
| Jajak pendapat           | Tidak didukung                              |
| Perintah native          | Tidak didukung                              |
| Balas ke / kutipan       | Tidak digunakan (selalu dinonaktifkan)      |

## Target pengiriman (CLI/Cron)

Gunakan ID obrolan sebagai target:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Pemecahan masalah

**Bot tidak merespons:**

- Periksa token: `openclaw channels status --probe`
- Pastikan pengirim telah disetujui (pemasangan atau `allowFrom`)
- Periksa log Gateway: `openclaw logs --follow`

**Webhook tidak menerima kejadian:**

- Pastikan URL Webhook menggunakan HTTPS
- Pastikan rahasia terdiri dari 8-256 karakter
- Pastikan endpoint HTTP Gateway dapat dijangkau pada jalur yang dikonfigurasi
- Pastikan polling getUpdates tidak juga berjalan (keduanya saling eksklusif)
- Lonjakan permintaan dapat menghasilkan HTTP 429 (120 permintaan / 60 detik per jalur+IP); tunggu sejenak lalu coba lagi

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

| Pengaturan                                   | Deskripsi                                         | Bawaan                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | Aktifkan/nonaktifkan pemulaian saluran            | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | Token bot dari Zalo Bot Platform                  | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | Baca token dari file (symlink ditolak)             | -                     |
| `channels.zalo.accounts.<id>.name`           | Nama tampilan                                     | -                     |
| `channels.zalo.accounts.<id>.enabled`        | Aktifkan/nonaktifkan akun ini                     | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | Kebijakan pesan langsung per akun                 | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | Daftar izin pesan langsung (ID pengguna)          | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | Kebijakan grup per akun                           | lihat [Grup](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Daftar izin pengirim grup; kembali ke `allowFrom` | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Batas media masuk/keluar (MB)                     | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Aktifkan mode Webhook (HTTPS diwajibkan)          | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | Rahasia Webhook (8-256 karakter)                  | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | Jalur Webhook pada server HTTP Gateway            | jalur URL Webhook     |
| `channels.zalo.accounts.<id>.proxy`          | URL proksi untuk permintaan API                   | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | Penimpaan prefiks respons keluar                  | -                     |
| `channels.zalo.defaultAccount`               | Akun bawaan saat beberapa akun dikonfigurasi      | `default`             |

`channels.zalo.botToken`, `channels.zalo.dmPolicy`, dan kunci tingkat atas datar lainnya adalah bentuk singkat akun tunggal lama untuk kolom di atas; kedua bentuk didukung.

Opsi env: `ZALO_BOT_TOKEN=...` hanya ditetapkan sebagai token akun bawaan.

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
