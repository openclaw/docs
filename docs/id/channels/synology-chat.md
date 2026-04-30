---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean Webhook Synology Chat
summary: Penyiapan Webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T09:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: channel pesan langsung plugin bawaan yang menggunakan Webhook Synology Chat.
Plugin menerima pesan masuk dari Webhook keluar Synology Chat dan mengirim balasan
melalui Webhook masuk Synology Chat.

## Plugin bawaan

Synology Chat dikirimkan sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Synology Chat,
instal secara manual:

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan plugin Synology Chat tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dari checkout sumber dengan perintah di atas.
   - `openclaw onboard` sekarang menampilkan Synology Chat dalam daftar penyiapan channel yang sama dengan `openclaw channels add`.
   - Penyiapan non-interaktif: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Di integrasi Synology Chat:
   - Buat Webhook masuk dan salin URL-nya.
   - Buat Webhook keluar dengan token rahasia Anda.
3. Arahkan URL Webhook keluar ke Gateway OpenClaw Anda:
   - `https://gateway-host/webhook/synology` secara default.
   - Atau `channels.synology-chat.webhookPath` kustom Anda.
4. Selesaikan penyiapan di OpenClaw.
   - Terpandu: `openclaw onboard`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Mulai ulang Gateway dan kirim DM ke bot Synology Chat.

Detail autentikasi Webhook:

- OpenClaw menerima token Webhook keluar dari `body.token`, lalu
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token kosong atau tidak ada akan gagal tertutup.

Konfigurasi minimal:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variabel lingkungan

Untuk akun default, Anda dapat menggunakan env vars:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (dipisahkan koma)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Nilai konfigurasi menimpa env vars.

`SYNOLOGY_CHAT_INCOMING_URL` tidak dapat diatur dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).

## Kebijakan DM dan kontrol akses

- `dmPolicy: "allowlist"` adalah default yang direkomendasikan.
- `allowedUserIds` menerima daftar (atau string yang dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` kosong diperlakukan sebagai salah konfigurasi dan rute Webhook tidak akan dimulai (gunakan `dmPolicy: "open"` dengan `allowedUserIds: ["*"]` untuk mengizinkan semua).
- `dmPolicy: "open"` mengizinkan DM publik hanya ketika `allowedUserIds` menyertakan `"*"`; dengan entri restriktif, hanya pengguna yang cocok yang dapat mengobrol.
- `dmPolicy: "disabled"` memblokir DM.
- Pengikatan penerima balasan tetap pada `user_id` numerik stabil secara default. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencarian nama pengguna/nama panggilan yang dapat berubah untuk pengiriman balasan.
- Persetujuan pairing bekerja dengan:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Pengiriman keluar

Gunakan ID pengguna Synology Chat numerik sebagai target.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Pengiriman media didukung oleh pengiriman file berbasis URL.
URL file keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau yang diblokir akan ditolak sebelum OpenClaw meneruskan URL ke Webhook NAS.

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat menimpa token, URL masuk, jalur Webhook, kebijakan DM, dan batas.
Sesi pesan langsung diisolasi per akun dan pengguna, sehingga `user_id` numerik yang sama
pada dua akun Synology berbeda tidak berbagi status transkrip.
Berikan `webhookPath` yang berbeda untuk setiap akun yang diaktifkan. OpenClaw sekarang menolak jalur persis yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi jalur Webhook bersama dalam penyiapan multi-akun.
Jika Anda memang memerlukan pewarisan lama untuk akun bernama, atur
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi jalur persis yang duplikat tetap ditolak secara gagal tertutup. Lebih baik gunakan jalur eksplisit per akun.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Catatan keamanan

- Jaga kerahasiaan `token` dan rotasikan jika bocor.
- Pertahankan `allowInsecureSsl: false` kecuali Anda secara eksplisit memercayai sertifikat NAS lokal yang ditandatangani sendiri.
- Permintaan Webhook masuk diverifikasi tokennya dan dibatasi lajunya per pengirim.
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia waktu konstan dan gagal tertutup.
- Lebih baik gunakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` mati kecuali Anda secara eksplisit memerlukan pengiriman balasan lama berbasis nama pengguna.
- Biarkan `dangerouslyAllowInheritedWebhookPath` mati kecuali Anda secara eksplisit menerima risiko routing jalur bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload Webhook keluar tidak memiliki salah satu field yang wajib
  - jika Synology mengirim token dalam header, pastikan Gateway/proxy mempertahankan header tersebut
- `Invalid token`:
  - rahasia Webhook keluar tidak cocok dengan `channels.synology-chat.token`
  - permintaan mengenai akun/jalur Webhook yang salah
  - reverse proxy menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat mengunci sumber tersebut untuk sementara
  - pengirim terautentikasi juga memiliki batas laju pesan per pengguna yang terpisah
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada di `allowedUserIds`

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating sebutan
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
