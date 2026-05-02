---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean Webhook Synology Chat
summary: Penyiapan Webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T09:14:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Status: saluran pesan langsung Plugin bawaan yang menggunakan Webhook Synology Chat.
Plugin ini menerima pesan masuk dari Webhook keluar Synology Chat dan mengirim balasan
melalui Webhook masuk Synology Chat.

## Plugin bawaan

Synology Chat disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang mengecualikan Synology Chat,
instal secara manual:

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan Plugin Synology Chat tersedia.
   - Rilis OpenClaw berpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dari checkout sumber dengan perintah di atas.
   - `openclaw onboard` sekarang menampilkan Synology Chat dalam daftar penyiapan saluran yang sama dengan `openclaw channels add`.
   - Penyiapan noninteraktif: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
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

Untuk akun default, Anda dapat menggunakan variabel lingkungan:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (dipisahkan koma)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Nilai konfigurasi mengesampingkan variabel lingkungan.

`SYNOLOGY_CHAT_INCOMING_URL` tidak dapat diatur dari `.env` ruang kerja; lihat [File `.env` ruang kerja](/id/gateway/security).

## Kebijakan DM dan kontrol akses

- `dmPolicy: "allowlist"` adalah default yang direkomendasikan.
- `allowedUserIds` menerima daftar (atau string yang dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` kosong dianggap sebagai salah konfigurasi dan rute Webhook tidak akan dimulai (gunakan `dmPolicy: "open"` dengan `allowedUserIds: ["*"]` untuk mengizinkan semua).
- `dmPolicy: "open"` mengizinkan DM publik hanya ketika `allowedUserIds` menyertakan `"*"`; dengan entri restriktif, hanya pengguna yang cocok yang dapat mengobrol.
- `dmPolicy: "disabled"` memblokir DM.
- Pengikatan penerima balasan tetap menggunakan `user_id` numerik yang stabil secara default. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencarian nama pengguna/nama panggilan yang dapat berubah untuk pengiriman balasan.
- Persetujuan pemasangan bekerja dengan:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Pengiriman keluar

Gunakan ID pengguna Synology Chat numerik sebagai target.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Pengiriman media didukung melalui pengiriman file berbasis URL.
URL file keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau yang diblokir akan ditolak sebelum OpenClaw meneruskan URL ke Webhook NAS.

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat mengesampingkan token, URL masuk, jalur Webhook, kebijakan DM, dan batas.
Sesi pesan langsung diisolasi per akun dan pengguna, sehingga `user_id` numerik yang sama
pada dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan setiap akun yang diaktifkan `webhookPath` yang berbeda. OpenClaw sekarang menolak jalur persis duplikat
dan menolak memulai akun bernama yang hanya mewarisi jalur Webhook bersama dalam penyiapan multi-akun.
Jika Anda sengaja memerlukan pewarisan lama untuk akun bernama, atur
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi jalur persis duplikat tetap ditolak secara gagal tertutup. Utamakan jalur eksplisit per akun.

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
- Utamakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` nonaktif kecuali Anda secara eksplisit memerlukan pengiriman balasan lama berbasis nama pengguna.
- Biarkan `dangerouslyAllowInheritedWebhookPath` nonaktif kecuali Anda secara eksplisit menerima risiko perutean jalur bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload Webhook keluar kehilangan salah satu bidang wajib
  - jika Synology mengirim token dalam header, pastikan Gateway/proksi mempertahankan header tersebut
- `Invalid token`:
  - rahasia Webhook keluar tidak cocok dengan `channels.synology-chat.token`
  - permintaan mengenai akun/jalur Webhook yang salah
  - proksi balik menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat mengunci sumber tersebut untuk sementara
  - pengirim yang diautentikasi juga memiliki batas laju pesan per pengguna terpisah
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada di `allowedUserIds`

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
