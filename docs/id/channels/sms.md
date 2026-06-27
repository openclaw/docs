---
read_when:
    - Anda ingin menghubungkan OpenClaw ke SMS melalui Twilio
    - Anda memerlukan pengaturan Webhook SMS atau allowlist
summary: Penyiapan channel SMS Twilio, kontrol akses, dan konfigurasi webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:12:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw dapat menerima dan mengirim SMS melalui nomor telepon Twilio atau Messaging Service. Gateway mendaftarkan rute webhook masuk, memvalidasi tanda tangan permintaan Twilio secara default, dan mengirim balasan kembali melalui Messages API milik Twilio.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default untuk SMS adalah pairing.
  </Card>
  <Card title="Gateway security" icon="shield" href="/id/gateway/security">
    Tinjau paparan webhook dan kontrol akses pengirim.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan panduan perbaikan.
  </Card>
</CardGroup>

## Sebelum Anda mulai

Anda memerlukan:

- Plugin SMS resmi yang diinstal dengan `openclaw plugins install @openclaw/sms`.
- Akun Twilio dengan nomor telepon yang mendukung SMS, atau Twilio Messaging Service.
- Twilio Account SID dan Auth Token.
- URL HTTPS publik yang mencapai OpenClaw Gateway Anda.
- Pilihan kebijakan pengirim: `pairing` untuk penggunaan pribadi, `allowlist` untuk nomor telepon yang sudah disetujui, atau `open` hanya untuk akses SMS yang memang sengaja dibuat publik.

Gunakan satu nomor Twilio untuk SMS dan Voice Call jika nomor tersebut memiliki kedua kapabilitas. Konfigurasikan webhook SMS dan webhook Voice secara terpisah di Twilio; halaman ini hanya membahas webhook SMS.

## Penyiapan Cepat

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    Di Twilio, buka **Phone Numbers > Manage > Active numbers** dan pilih nomor yang mendukung SMS. Simpan:

    - Account SID, misalnya `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Nomor telepon pengirim, misalnya `+15551234567`

    Jika Anda menggunakan Messaging Service alih-alih nomor pengirim tetap, simpan Messaging Service SID, misalnya `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure the SMS channel">

Simpan ini sebagai `sms.patch.json5` dan ubah placeholder-nya:

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

  <Step title="Point Twilio at the Gateway webhook">
    Di pengaturan nomor telepon Twilio, buka **Messaging** dan atur **A message comes in** ke:

```text
https://gateway.example.com/webhooks/sms
```

    Gunakan HTTP `POST`. Path lokal default adalah `/webhooks/sms`; ubah `channels.sms.webhookPath` jika Anda memerlukan rute berbeda.

  </Step>

  <Step title="Expose the exact SMS webhook path">
    URL publik Anda harus merutekan path SMS ke proses Gateway. Jika Anda menggunakan Tailscale Funnel untuk pengujian lokal, ekspos `/webhooks/sms` secara eksplisit:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call dan SMS menggunakan path webhook terpisah. Jika nomor Twilio yang sama menangani keduanya, pertahankan kedua rute tetap dikonfigurasi di Twilio dan di tunnel Anda.

  </Step>

  <Step title="Start the Gateway and approve first sender">

```bash
openclaw gateway
```

Kirim pesan teks ke nomor Twilio. Pesan pertama membuat permintaan pairing. Setujui:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Kode pairing kedaluwarsa setelah 1 jam.

  </Step>
</Steps>

## Contoh Konfigurasi

### File konfigurasi

Gunakan penyiapan file konfigurasi ketika Anda ingin definisi channel ikut bersama konfigurasi Gateway:

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

Gunakan penyiapan env untuk deployment akun tunggal saat rahasia berasal dari lingkungan host:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Lalu aktifkan channel dalam konfigurasi:

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

`TWILIO_SMS_FROM` diterima sebagai alias untuk `TWILIO_PHONE_NUMBER`. Gunakan `TWILIO_MESSAGING_SERVICE_SID` alih-alih pengirim nomor telepon saat Twilio harus memilih pengirim dari Messaging Service.

### Token autentikasi SecretRef

`authToken` dapat berupa SecretRef. Gunakan ini ketika Gateway harus menyelesaikan Twilio Auth Token dari runtime rahasia OpenClaw alih-alih menyimpan konfigurasi plaintext:

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

Variabel lingkungan atau penyedia rahasia yang dirujuk harus terlihat oleh runtime Gateway. Mulai ulang proses Gateway terkelola setelah mengubah variabel lingkungan host.

### Nomor privat khusus allowlist

Gunakan `allowlist` ketika hanya nomor telepon yang dikenal yang boleh berbicara dengan agen:

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

### Pengirim Messaging Service

Gunakan `messagingServiceSid` alih-alih `fromNumber` saat Twilio harus memilih pengirim melalui Messaging Service:

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

Jika `fromNumber` dan `messagingServiceSid` sama-sama ada setelah penyelesaian konfigurasi dan env, `fromNumber` digunakan.

### Target outbound default

Atur `defaultTo` ketika otomasi atau pengiriman yang diinisiasi agen harus memiliki tujuan default jika alur pengiriman tidak mencantumkan target eksplisit:

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

- `pairing` (default)
- `allowlist` (memerlukan setidaknya satu pengirim di `allowFrom`)
- `open` (memerlukan `allowFrom` menyertakan `"*"`)
- `disabled`

Entri `allowFrom` harus berupa nomor telepon E.164 seperti `+15551234567`. Prefiks `sms:` diterima dan dinormalisasi. Untuk asisten privat, pilih `dmPolicy: "allowlist"` dengan nomor telepon eksplisit.

## Mengirim SMS

Target SMS outbound menggunakan prefiks layanan `sms:` dengan channel SMS yang dipilih:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Ketika pemilihan channel bersifat implisit, `twilio-sms:+15551234567` memilih channel ini tanpa mengambil alih prefiks layanan `sms:` milik channel yang sudah ada dan digunakan oleh iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI memerlukan `--target` eksplisit. `defaultTo` digunakan untuk jalur otomasi dan pengiriman yang diinisiasi agen ketika target dapat diselesaikan dari konfigurasi channel.

Balasan agen dari percakapan SMS masuk otomatis dikirim kembali ke pengirim melalui pengirim Twilio yang dikonfigurasi.

Output SMS berupa teks biasa. OpenClaw menghapus markdown, meratakan blok kode berpagar, mempertahankan tautan yang mudah dibaca, dan memecah balasan panjang sebelum mengirimkannya melalui Twilio.

## Verifikasi Penyiapan

Setelah Gateway dimulai:

1. Pastikan log Gateway menampilkan rute webhook SMS.
2. Jalankan probe dari sisi Twilio:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Kirim SMS ke nomor Twilio dari telepon Anda.
4. Jalankan `openclaw pairing list sms`.
5. Setujui kode pairing dengan `openclaw pairing approve sms <CODE>`.
6. Kirim SMS lain dan pastikan agen membalas.

Untuk pengujian khusus outbound, gunakan:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Pengujian end-to-end dari macOS iMessage/SMS

Di Mac yang dapat mengirim SMS operator melalui Messages, Anda dapat menggunakan `imsg` untuk menjalankan sisi pengirim tanpa menyentuh telepon Anda:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Pesan pertama seharusnya membuat permintaan pairing. Pesan kedua seharusnya menerima balasan agen melalui Twilio.

## Keamanan webhook

Secara default, OpenClaw memvalidasi `X-Twilio-Signature` menggunakan `publicWebhookUrl` dan `authToken`. Pastikan `publicWebhookUrl` selaras byte demi byte dengan URL yang dikonfigurasi di Twilio, termasuk skema, host, path, dan string kueri.

Hanya untuk pengujian tunnel lokal, Anda dapat mengatur:

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

## Konfigurasi multi-akun

Gunakan `accounts` ketika Anda mengoperasikan lebih dari satu nomor Twilio:

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

Setiap akun harus menggunakan `webhookPath` yang berbeda.

## Pemecahan masalah

### Twilio mengembalikan 403 atau OpenClaw menolak webhook

Periksa bahwa `publicWebhookUrl` sama persis dengan URL yang dikonfigurasi di Twilio, termasuk skema, host, path, dan string kueri. Twilio menandatangani string URL publik, jadi penulisan ulang proxy dan nama host alternatif dapat merusak validasi tanda tangan.

### Tidak ada permintaan pairing yang muncul

Periksa URL dan metode webhook **Messaging** milik nomor Twilio. Itu harus mengarah ke URL webhook SMS dan menggunakan `POST`. Pastikan juga Gateway dapat dijangkau dari internet publik atau melalui tunnel Anda.

Jika log pesan Twilio menampilkan error `11200`, Twilio menerima SMS masuk tetapi tidak dapat mencapai webhook Anda. Periksa:

- Twilio **Messaging > A message comes in** mengarah ke `publicWebhookUrl`.
- Metodenya adalah `POST`.
- Tunnel atau reverse proxy mengekspos `webhookPath` yang tepat; untuk Tailscale Funnel, jalankan `tailscale funnel status` dan pastikan `/webhooks/sms` tercantum.
- `publicWebhookUrl` menggunakan skema, host, path, dan string kueri yang sama dengan yang dikirim Twilio, sehingga validasi tanda tangan dapat mereproduksi URL yang ditandatangani.

### Pengiriman outbound gagal

Pastikan `accountSid`, `authToken`, dan salah satu dari `fromNumber` atau `messagingServiceSid` terselesaikan. Jika Anda menggunakan akun uji coba Twilio, nomor tujuan mungkin perlu diverifikasi di Twilio sebelum SMS outbound dapat dikirim.

### Pesan masuk tetapi agen tidak menjawab

Periksa `dmPolicy` dan `allowFrom`. Dengan kebijakan `pairing` default, pengirim harus disetujui sebelum giliran agen normal diproses.
