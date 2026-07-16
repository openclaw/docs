---
read_when:
    - Anda ingin menghubungkan OpenClaw ke SMS melalui Twilio
    - Anda memerlukan penyiapan Webhook SMS atau daftar izin
summary: Penyiapan saluran SMS Twilio, kontrol akses, dan konfigurasi webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T17:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw menerima dan mengirim SMS melalui nomor telepon Twilio atau Messaging Service. Gateway mendaftarkan rute Webhook masuk (default `/webhooks/sms`), memvalidasi tanda tangan permintaan Twilio secara default, dan mengirim balasan kembali melalui Messages API Twilio.

Status: Plugin resmi, dipasang secara terpisah. Hanya teks: tanpa MMS/media, hanya pesan langsung.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk SMS adalah pemasangan.
  </Card>
  <Card title="Keamanan Gateway" icon="shield" href="/id/gateway/security">
    Tinjau paparan Webhook dan kontrol akses pengirim.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan panduan perbaikan.
  </Card>
</CardGroup>

## Sebelum memulai

Anda memerlukan:

- Plugin SMS resmi yang dipasang dengan `openclaw plugins install @openclaw/sms`.
- Akun Twilio dengan nomor telepon yang mendukung SMS, atau Twilio Messaging Service.
- Account SID dan Auth Token Twilio.
- URL HTTPS publik yang dapat menjangkau Gateway OpenClaw Anda.
- Pilihan kebijakan pengirim: `pairing` (default) untuk penggunaan pribadi, `allowlist` untuk nomor telepon yang telah disetujui sebelumnya, atau `open` hanya untuk akses SMS yang sengaja dibuka untuk publik.

Satu nomor Twilio dapat melayani SMS dan [Panggilan Suara](/id/plugins/voice-call) jika memiliki kedua kemampuan tersebut. Webhook SMS dan Webhook Suara dikonfigurasi secara terpisah di Twilio dan menggunakan jalur Gateway yang berbeda; halaman ini hanya membahas Webhook SMS.

## Penyiapan Cepat

<Steps>
  <Step title="Pasang Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Buat atau pilih pengirim Twilio">
    Di Twilio, buka **Phone Numbers > Manage > Active numbers** dan pilih nomor yang mendukung SMS. Simpan:

    - Account SID, misalnya `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Nomor telepon pengirim, misalnya `+15551234567`

    Jika Anda menggunakan Messaging Service dan bukan nomor pengirim tetap, simpan SID Messaging Service, misalnya `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Konfigurasikan saluran SMS">

Simpan ini sebagai `sms.patch.json5` dan ubah placeholder:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Terapkan:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Arahkan Twilio ke Webhook Gateway">
    Di pengaturan nomor telepon Twilio, buka **Messaging** dan atur **A message comes in** ke:

```text
https://gateway.example.com/webhooks/sms
```

    Gunakan HTTP `POST`. Jalur lokal default adalah `/webhooks/sms`; ubah `channels.sms.webhookPath` jika Anda memerlukan rute lain.

  </Step>

  <Step title="Paparkan jalur Webhook SMS yang tepat">
    URL publik Anda harus merutekan jalur SMS ke proses Gateway (port default `18789`). Jika menggunakan Tailscale Funnel untuk pengujian lokal, paparkan `/webhooks/sms` secara eksplisit:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Panggilan Suara dan SMS menggunakan jalur Webhook yang berbeda. Jika nomor Twilio yang sama menangani keduanya, pertahankan konfigurasi kedua rute di Twilio dan terowongan Anda.

  </Step>

  <Step title="Mulai Gateway dan setujui pengirim pertama">

```bash
openclaw gateway
```

Kirim pesan teks ke nomor Twilio. Pesan pertama membuat permintaan pemasangan. Setujui:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Kode pemasangan kedaluwarsa setelah 1 jam.

  </Step>
</Steps>

## Contoh Konfigurasi

Semua kunci berada di bawah `channels.sms` (dan untuk setiap akun di bawah `channels.sms.accounts.<id>`):

| Kunci                                   | Default         | Tujuan                                                              |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Aktifkan atau nonaktifkan saluran/akun.                             |
| `accountSid`                            | —               | Account SID Twilio (`AC...`).                                       |
| `authToken`                             | —               | Auth Token Twilio; string teks biasa atau SecretRef.                |
| `fromNumber`                            | —               | Nomor pengirim E.164.                                               |
| `messagingServiceSid`                   | —               | SID Messaging Service (`MG...`) yang digunakan saat tidak ada `fromNumber` yang dapat diuraikan. |
| `defaultTo`                             | —               | Tujuan default saat alur pengiriman tidak menyertakan target eksplisit. |
| `webhookPath`                           | `/webhooks/sms` | Jalur HTTP Gateway untuk Webhook Twilio yang masuk.                 |
| `publicWebhookUrl`                      | —               | URL publik yang dikonfigurasi di Twilio; diperlukan untuk validasi tanda tangan. |
| `dangerouslyDisableSignatureValidation` | `false`         | Lewati pemeriksaan `X-Twilio-Signature`; hanya untuk pengujian terowongan lokal. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open`, atau `disabled`.                      |
| `allowFrom`                             | `[]`            | Nomor pengirim yang diizinkan dalam E.164, atau `"*"` dengan `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Jumlah karakter maksimum per potongan SMS keluar.                   |
| `accounts`, `defaultAccount`            | —               | Peta multiakun dan id akun default.                                 |

### Berkas konfigurasi

Gunakan penyiapan berkas konfigurasi jika Anda ingin definisi saluran disertakan bersama konfigurasi Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Variabel lingkungan

Variabel lingkungan hanya berlaku untuk akun default; nilai konfigurasi lebih diutamakan daripada nilai lingkungan.

| Variabel                                        | Dipetakan ke                                        |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (dipisahkan koma)                      |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Kemudian aktifkan saluran dalam konfigurasi:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Auth Token SecretRef

`authToken` dapat berupa SecretRef (`source: "env" | "file" | "exec"`). Gunakan ini jika Gateway harus menguraikan Auth Token Twilio dari runtime rahasia OpenClaw alih-alih menyimpan konfigurasi dalam teks biasa:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Variabel lingkungan atau penyedia rahasia yang dirujuk harus terlihat oleh runtime Gateway. Mulai ulang proses Gateway terkelola setelah mengubah variabel lingkungan hos.

### Pengirim Messaging Service

Gunakan `messagingServiceSid` alih-alih `fromNumber` jika Twilio harus memilih pengirim melalui Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Jika `fromNumber` dan `messagingServiceSid` keduanya tersedia setelah penguraian konfigurasi dan lingkungan, `fromNumber` digunakan.

### Target keluar default

Atur `defaultTo` jika otomatisasi atau pengiriman yang dimulai agen harus memiliki tujuan default ketika alur pengiriman tidak menyertakan target eksplisit:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Kontrol akses

`channels.sms.dmPolicy` mengontrol akses SMS langsung:

- `pairing` (default): pengirim yang tidak dikenal mendapatkan kode pemasangan; setujui dengan `openclaw pairing approve sms <CODE>`.
- `allowlist`: hanya pengirim dalam `allowFrom` yang diproses. `allowFrom` kosong menolak setiap pengirim (Gateway mencatat peringatan saat dimulai).
- `open`: validasi konfigurasi mengharuskan `allowFrom` menyertakan `"*"`. Tanpa wildcard, hanya nomor yang tercantum yang dapat mengobrol.
- `disabled`: semua DM masuk dibuang.

Entri `allowFrom` harus berupa nomor telepon E.164 seperti `+15551234567`. Awalan `sms:` dan `twilio-sms:` diterima dan dinormalisasi. Untuk asisten pribadi, pilih `dmPolicy: "allowlist"` dengan nomor telepon eksplisit:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Mengirim SMS

Dengan saluran SMS dipilih, target menerima nomor E.164 polos atau awalan `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Saat pemilihan saluran bersifat implisit, awalan `twilio-sms:` memilih saluran ini tanpa mengambil alih awalan layanan `sms:`, yang digunakan iMessage untuk memilih pengiriman SMS operator bagi targetnya sendiri:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI memerlukan `--target` eksplisit. `defaultTo` ditujukan untuk jalur otomatisasi dan pengiriman yang dimulai agen, tempat target dapat diuraikan dari konfigurasi saluran.

Balasan agen dari percakapan SMS masuk secara otomatis dikirim kembali kepada pengirim melalui pengirim Twilio yang dikonfigurasi.

Keluaran SMS berupa teks biasa. OpenClaw menghapus markdown, meratakan blok kode berpagar, menulis ulang tautan sebagai `label (url)`, dan membagi balasan panjang menjadi potongan yang masing-masing berisi paling banyak `textChunkLimit` karakter (nilai bawaan 1500) sebelum mengirimkannya melalui Twilio.

## Verifikasi Penyiapan

Setelah Gateway dimulai:

1. Pastikan log Gateway menampilkan rute Webhook SMS.
2. Jalankan pemeriksaan dari sisi Twilio (memeriksa URL/metode Webhook Twilio yang dikonfigurasi dan galat masuk terbaru):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Kirim SMS ke nomor Twilio dari ponsel Anda.
4. Jalankan `openclaw pairing list sms`.
5. Setujui kode pemasangan dengan `openclaw pairing approve sms <CODE>`.
6. Kirim SMS lainnya dan pastikan agen membalas.

Untuk pengujian khusus keluar, gunakan:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Pengujian menyeluruh dari iMessage/SMS macOS

Pada Mac yang dapat mengirim SMS operator melalui Messages, Anda dapat menggunakan `imsg` untuk menjalankan sisi pengirim tanpa menyentuh ponsel:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Pesan pertama seharusnya membuat permintaan pemasangan. Pesan kedua seharusnya menerima balasan agen melalui Twilio.

## Keamanan Webhook

Secara bawaan, OpenClaw memvalidasi `X-Twilio-Signature` menggunakan `publicWebhookUrl` dan `authToken`. Pastikan bagian titik akhir dari `publicWebhookUrl` sama persis byte demi byte dengan URL yang dikonfigurasi di Twilio, termasuk skema, host, jalur, dan string kueri. OpenClaw mengecualikan fragmen [penggantian koneksi](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) Twilio (`#...`) dari penghitungan tanda tangan, sebagaimana diwajibkan oleh Twilio.

Rute Webhook juga memberlakukan hal berikut, secara independen dari validasi tanda tangan:

- `POST` saja.
- Batas permintaan gagal sebanyak 300 permintaan per menit untuk setiap akun SMS, rute Webhook, dan alamat klien yang ditentukan. Semua permintaan dihitung dalam batas ini, tetapi HTTP 429 hanya diterapkan setelah permintaan gagal mengurai isi, memvalidasi Twilio, atau mencocokkan AccountSid.
- Batas laju panggilan balik yang dapat diteruskan sebanyak 30 panggilan balik yang diterima per menit untuk setiap akun SMS, rute Webhook, dan alamat klien yang ditentukan setelah pemeriksaan tersebut lolos (HTTP 429 jika melampaui batas tersebut). Jika validasi tanda tangan dinonaktifkan, batas 30/menit ini menjadi batas maksimum penerusan tanpa autentikasi.
- Alamat klien ditentukan melalui aturan proksi tepercaya bersama milik Gateway. Jika `gateway.trustedProxies` berisi proksi terbalik yang meneruskan panggilan balik Twilio, OpenClaw mendasarkan batas ini pada alamat klien yang diteruskan; jika tidak, OpenClaw menggunakan alamat soket langsung.
- `AccountSid` dalam muatan harus cocok dengan `accountSid` yang dikonfigurasi (jika tidak, HTTP 403).
- Nilai `MessageSid` yang diputar ulang dideduplikasi selama 10 menit.
- Cache pemutaran ulang setiap akun SMS menyimpan hingga 10,000 SID pesan aktif. Ketika semua slot masih aktif, Webhook baru untuk akun tersebut ditolak secara tertutup dengan HTTP 429 dan header `Retry-After` hingga slot terlama kedaluwarsa.
- Isi permintaan yang melebihi 32 KB ditolak.

Secara bawaan, Twilio tidak mencoba ulang HTTP 429 maupun mendokumentasikan dukungan untuk `Retry-After`. Penggantian koneksi `#rp=4xx` dan `#rp=all` mengaktifkan percobaan ulang untuk 4xx, tetapi Twilio membatasi keseluruhan transaksi percobaan ulang hingga 15 detik, sehingga percobaan ulang masih dapat berakhir sebelum slot cache pemutaran ulang kedaluwarsa. Konfigurasikan URL cadangan ketika penangan lain harus menerima pengiriman yang gagal; perlakukan 429 sebagai penolakan tertutup saat gagal, bukan tekanan balik yang andal.

Khusus untuk pengujian terowongan lokal, Anda dapat menetapkan:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Jangan gunakan validasi tanda tangan yang dinonaktifkan pada Gateway publik.

## Konfigurasi Multiakun

Gunakan `accounts` jika Anda mengoperasikan lebih dari satu nomor Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Setiap akun harus menggunakan `webhookPath` yang berbeda; Gateway menolak mendaftarkan rute Webhook yang jalurnya sudah dimiliki akun lain. Nilai cadangan lingkungan `TWILIO_*`/`SMS_*` hanya berlaku untuk akun bawaan; tetapkan `defaultAccount` untuk mengubah akun yang menjadi akun bawaan.

## Pemecahan Masalah

### Twilio mengembalikan 403 atau OpenClaw menolak Webhook

Pastikan `publicWebhookUrl` sama persis dengan URL yang dikonfigurasi di Twilio, termasuk skema, host, jalur, dan string kueri. Twilio menandatangani string URL publik, sehingga penulisan ulang oleh proksi dan nama host alternatif dapat menggagalkan validasi tanda tangan.

Respons 403 dengan `Invalid account` berarti `AccountSid` dalam muatan masuk tidak cocok dengan `accountSid` yang dikonfigurasi; pastikan Webhook mengarah ke akun yang memiliki nomor tersebut.

### Permintaan pemasangan tidak muncul

Periksa URL dan metode Webhook **Messaging** milik nomor Twilio. URL tersebut harus mengarah ke URL Webhook SMS dan menggunakan `POST`. Pastikan juga Gateway dapat dijangkau dari internet publik atau melalui terowongan Anda.

Jika log pesan Twilio menampilkan galat `11200`, Twilio menerima SMS masuk tetapi tidak dapat menjangkau Webhook Anda. Periksa:

- Twilio **Messaging > A message comes in** mengarah ke `publicWebhookUrl`.
- Metodenya adalah `POST`.
- Terowongan atau proksi terbalik mengekspos `webhookPath` yang tepat; untuk Tailscale Funnel, jalankan `tailscale funnel status` dan pastikan `/webhooks/sms` tercantum.
- `publicWebhookUrl` menggunakan skema, host, jalur, dan string kueri yang sama dengan yang dikirim Twilio, sehingga validasi tanda tangan dapat mereproduksi URL yang ditandatangani.

`openclaw channels status --channel sms --probe` menampilkan ketidakcocokan pengaturan Webhook Twilio dan galat `11200` terbaru.

### Pengiriman keluar gagal

Pastikan `accountSid`, `authToken`, serta `fromNumber` atau `messagingServiceSid` telah ditentukan. Jika Anda menggunakan akun uji coba Twilio, nomor tujuan mungkin perlu diverifikasi di Twilio sebelum SMS keluar dapat dikirim.

### Pesan tiba tetapi agen tidak menjawab

Periksa `dmPolicy` dan `allowFrom`. Dengan kebijakan `pairing` bawaan, pengirim harus disetujui sebelum giliran agen normal diproses.
