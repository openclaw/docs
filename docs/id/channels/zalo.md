---
read_when:
    - Mengerjakan fitur Zalo atau Webhook
summary: Status dukungan, kemampuan, dan konfigurasi bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperimental. DM didukung. Bagian [Kemampuan](#capabilities) di bawah mencerminkan perilaku bot Marketplace saat ini.

## Plugin bawaan

Zalo disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Zalo, instal paket npm secara langsung:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalo`
- Versi yang dipatok: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Atau dari checkout sumber: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan Plugin Zalo tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Tetapkan token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Atau konfigurasi: `channels.zalo.accounts.default.botToken: "..."`.
3. Mulai ulang Gateway (atau selesaikan penyiapan).
4. Akses DM menggunakan pairing secara default; setujui kode pairing pada kontak pertama.

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

## Apa ini

Zalo adalah aplikasi perpesanan yang berfokus pada Vietnam; Bot API-nya memungkinkan Gateway menjalankan bot untuk percakapan 1:1.
Ini cocok untuk dukungan atau notifikasi ketika Anda menginginkan perutean deterministik kembali ke Zalo.

Halaman ini mencerminkan perilaku OpenClaw saat ini untuk **bot Zalo Bot Creator / Marketplace**.
**Bot Zalo Official Account (OA)** adalah permukaan produk Zalo yang berbeda dan dapat berperilaku berbeda.

- Kanal Zalo Bot API yang dimiliki oleh Gateway.
- Perutean deterministik: balasan kembali ke Zalo; model tidak pernah memilih kanal.
- DM berbagi sesi utama agen.
- Bagian [Kemampuan](#capabilities) di bawah menunjukkan dukungan bot Marketplace saat ini.

## Penyiapan (jalur cepat)

### 1) Buat token bot (Zalo Bot Platform)

1. Buka [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) dan masuk.
2. Buat bot baru dan konfigurasikan pengaturannya.
3. Salin token bot lengkap (biasanya `numeric_id:secret`). Untuk bot Marketplace, token runtime yang dapat digunakan mungkin muncul di pesan sambutan bot setelah dibuat.

### 2) Konfigurasikan token (env atau konfigurasi)

Contoh:

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

Jika nanti Anda berpindah ke permukaan bot Zalo tempat grup tersedia, Anda dapat menambahkan konfigurasi khusus grup seperti `groupPolicy` dan `groupAllowFrom` secara eksplisit. Untuk perilaku bot Marketplace saat ini, lihat [Kemampuan](#capabilities).

Opsi env: `ZALO_BOT_TOKEN=...` (hanya berfungsi untuk akun default).

Dukungan multi-akun: gunakan `channels.zalo.accounts` dengan token per akun dan `name` opsional.

3. Mulai ulang Gateway. Zalo dimulai saat token berhasil ditentukan (env atau konfigurasi).
4. Akses DM default ke pairing. Setujui kode saat bot pertama kali dihubungi.

## Cara kerjanya (perilaku)

- Pesan masuk dinormalisasi ke dalam envelope kanal bersama dengan placeholder media.
- Balasan selalu dirutekan kembali ke chat Zalo yang sama.
- Long-polling secara default; mode Webhook tersedia dengan `channels.zalo.webhookUrl`.

## Batasan

- Teks keluar dipecah menjadi potongan 2000 karakter (batas Zalo API).
- Unduhan/unggahan media dibatasi oleh `channels.zalo.mediaMaxMb` (default 5).
- Streaming diblokir secara default karena batas 2000 karakter membuat streaming kurang berguna.

## Kontrol akses (DM)

### Akses DM

- Default: `channels.zalo.dmPolicy = "pairing"`. Pengirim tak dikenal menerima kode pairing; pesan diabaikan hingga disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)
- `channels.zalo.allowFrom` menerima ID pengguna numerik (pencarian nama pengguna tidak tersedia).

## Kontrol akses (Grup)

Untuk **bot Zalo Bot Creator / Marketplace**, dukungan grup tidak tersedia dalam praktik karena bot sama sekali tidak dapat ditambahkan ke grup.

Artinya, kunci konfigurasi terkait grup di bawah ada dalam skema, tetapi tidak dapat digunakan untuk bot Marketplace:

- `channels.zalo.groupPolicy` mengontrol penanganan masuk grup: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` membatasi ID pengirim mana yang dapat memicu bot di grup.
- Jika `groupAllowFrom` tidak ditetapkan, Zalo kembali ke `allowFrom` untuk pemeriksaan pengirim.
- Catatan runtime: jika `channels.zalo` sama sekali tidak ada, runtime tetap kembali ke `groupPolicy="allowlist"` demi keamanan.

Nilai kebijakan grup (saat akses grup tersedia di permukaan bot Anda) adalah:

- `groupPolicy: "disabled"` — memblokir semua pesan grup.
- `groupPolicy: "open"` — mengizinkan anggota grup mana pun (dibatasi mention).
- `groupPolicy: "allowlist"` — default gagal-tertutup; hanya pengirim yang diizinkan yang diterima.

Jika Anda menggunakan permukaan produk bot Zalo yang berbeda dan telah memverifikasi perilaku grup berfungsi, dokumentasikan hal itu secara terpisah daripada mengasumsikan perilakunya sama dengan alur bot Marketplace.

## Long-polling vs Webhook

- Default: long-polling (tidak memerlukan URL publik).
- Mode Webhook: tetapkan `channels.zalo.webhookUrl` dan `channels.zalo.webhookSecret`.
  - Rahasia Webhook harus 8-256 karakter.
  - URL Webhook harus menggunakan HTTPS.
  - Zalo mengirim peristiwa dengan header `X-Bot-Api-Secret-Token` untuk verifikasi.
  - HTTP Gateway menangani permintaan Webhook di `channels.zalo.webhookPath` (default ke path URL Webhook).
  - Permintaan harus menggunakan `Content-Type: application/json` (atau jenis media `+json`).
  - Peristiwa duplikat (`event_name + message_id`) diabaikan untuk jendela replay singkat.
  - Lalu lintas burst dibatasi lajunya per path/sumber dan dapat mengembalikan HTTP 429.

**Catatan:** getUpdates (polling) dan Webhook saling eksklusif menurut dokumentasi Zalo API.

## Jenis pesan yang didukung

Untuk ringkasan dukungan cepat, lihat [Kemampuan](#capabilities). Catatan di bawah menambahkan detail saat perilaku memerlukan konteks tambahan.

- **Pesan teks**: Dukungan penuh dengan pemecahan 2000 karakter.
- **URL polos dalam teks**: Berperilaku seperti input teks normal.
- **Pratinjau tautan / kartu tautan kaya**: Lihat status bot Marketplace di [Kemampuan](#capabilities); fitur ini tidak selalu memicu balasan secara andal.
- **Pesan gambar**: Lihat status bot Marketplace di [Kemampuan](#capabilities); penanganan gambar masuk tidak andal (indikator mengetik tanpa balasan akhir).
- **Stiker**: Lihat status bot Marketplace di [Kemampuan](#capabilities).
- **Catatan suara / file audio / video / lampiran file generik**: Lihat status bot Marketplace di [Kemampuan](#capabilities).
- **Jenis yang tidak didukung**: Dicatat (misalnya, pesan dari pengguna terlindungi).

## Kemampuan

Tabel ini merangkum perilaku **bot Zalo Bot Creator / Marketplace** saat ini di OpenClaw.

| Fitur                       | Status                                             |
| --------------------------- | -------------------------------------------------- |
| Pesan langsung              | ✅ Didukung                                        |
| Grup                        | ❌ Tidak tersedia untuk bot Marketplace            |
| Media (gambar masuk)        | ⚠️ Terbatas / verifikasi di lingkungan Anda        |
| Media (gambar keluar)       | ⚠️ Belum diuji ulang untuk bot Marketplace         |
| URL polos dalam teks        | ✅ Didukung                                        |
| Pratinjau tautan            | ⚠️ Tidak andal untuk bot Marketplace               |
| Reaksi                      | ❌ Tidak didukung                                  |
| Stiker                      | ⚠️ Tidak ada balasan agen untuk bot Marketplace    |
| Catatan suara / audio / video | ⚠️ Tidak ada balasan agen untuk bot Marketplace  |
| Lampiran file               | ⚠️ Tidak ada balasan agen untuk bot Marketplace    |
| Thread                      | ❌ Tidak didukung                                  |
| Polling                     | ❌ Tidak didukung                                  |
| Perintah native             | ❌ Tidak didukung                                  |
| Streaming                   | ⚠️ Diblokir (batas 2000 karakter)                  |

## Target pengiriman (CLI/cron)

- Gunakan id chat sebagai target.
- Contoh: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Pemecahan masalah

**Bot tidak merespons:**

- Periksa apakah token valid: `openclaw channels status --probe`
- Verifikasi pengirim sudah disetujui (pairing atau allowFrom)
- Periksa log Gateway: `openclaw logs --follow`

**Webhook tidak menerima peristiwa:**

- Pastikan URL Webhook menggunakan HTTPS
- Verifikasi token rahasia 8-256 karakter
- Konfirmasi endpoint HTTP Gateway dapat dijangkau pada path yang dikonfigurasi
- Periksa bahwa polling getUpdates tidak berjalan (keduanya saling eksklusif)

## Referensi konfigurasi (Zalo)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Kunci tingkat atas datar (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, dan sejenisnya) adalah shorthand satu akun lama. Lebih baik gunakan `channels.zalo.accounts.<id>.*` untuk konfigurasi baru. Kedua bentuk masih didokumentasikan di sini karena ada dalam skema.

Opsi penyedia:

- `channels.zalo.enabled`: aktifkan/nonaktifkan startup kanal.
- `channels.zalo.botToken`: token bot dari Zalo Bot Platform.
- `channels.zalo.tokenFile`: baca token dari path file reguler. Symlink ditolak.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID pengguna). `open` memerlukan `"*"`. Wizard akan meminta ID numerik.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (default: allowlist). Ada dalam konfigurasi; lihat [Kemampuan](#capabilities) dan [Kontrol akses (Grup)](#access-control-groups) untuk perilaku bot Marketplace saat ini.
- `channels.zalo.groupAllowFrom`: allowlist pengirim grup (ID pengguna). Kembali ke `allowFrom` jika tidak ditetapkan.
- `channels.zalo.mediaMaxMb`: batas media masuk/keluar (MB, default 5).
- `channels.zalo.webhookUrl`: aktifkan mode Webhook (HTTPS wajib).
- `channels.zalo.webhookSecret`: rahasia Webhook (8-256 karakter).
- `channels.zalo.webhookPath`: path Webhook pada server HTTP Gateway.
- `channels.zalo.proxy`: URL proksi untuk permintaan API.

Opsi multi-akun:

- `channels.zalo.accounts.<id>.botToken`: token per akun.
- `channels.zalo.accounts.<id>.tokenFile`: file token reguler per akun. Symlink ditolak.
- `channels.zalo.accounts.<id>.name`: nama tampilan.
- `channels.zalo.accounts.<id>.enabled`: aktifkan/nonaktifkan akun.
- `channels.zalo.accounts.<id>.dmPolicy`: kebijakan DM per akun.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per akun.
- `channels.zalo.accounts.<id>.groupPolicy`: kebijakan grup per akun. Ada dalam konfigurasi; lihat [Kemampuan](#capabilities) dan [Kontrol akses (Grup)](#access-control-groups) untuk perilaku bot Marketplace saat ini.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist pengirim grup per akun.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per akun.
- `channels.zalo.accounts.<id>.webhookSecret`: rahasia Webhook per akun.
- `channels.zalo.accounts.<id>.webhookPath`: path Webhook per akun.
- `channels.zalo.accounts.<id>.proxy`: URL proksi per akun.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
