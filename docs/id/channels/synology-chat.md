---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug routing Webhook Synology Chat
summary: Penyiapan Webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T08:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Status: Plugin bawaan channel pesan langsung yang menggunakan Webhook Synology Chat.
Plugin ini menerima pesan masuk dari outgoing webhook Synology Chat dan mengirim balasan
melalui incoming webhook Synology Chat.

## Plugin bawaan

Synology Chat disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Synology Chat,
instal secara manual:

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan Plugin Synology Chat tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya secara bawaan.
   - Instalasi lama/kustom dapat menambahkannya secara manual dari checkout sumber dengan perintah di atas.
   - `openclaw onboard` kini menampilkan Synology Chat dalam daftar penyiapan channel yang sama seperti `openclaw channels add`.
   - Penyiapan non-interaktif: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Di integrasi Synology Chat:
   - Buat incoming Webhook dan salin URL-nya.
   - Buat outgoing Webhook dengan token rahasia Anda.
3. Arahkan URL outgoing Webhook ke Gateway OpenClaw Anda:
   - `https://gateway-host/webhook/synology` secara default.
   - Atau `channels.synology-chat.webhookPath` kustom Anda.
4. Selesaikan penyiapan di OpenClaw.
   - Terpandu: `openclaw onboard`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Restart Gateway dan kirim DM ke bot Synology Chat.

Detail autentikasi Webhook:

- OpenClaw menerima token outgoing Webhook dari `body.token`, lalu
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token kosong atau hilang akan gagal secara fail-closed.

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

Untuk akun default, Anda dapat menggunakan env var:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (dipisahkan koma)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Nilai konfigurasi menimpa env var.

`SYNOLOGY_CHAT_INCOMING_URL` tidak dapat disetel dari `.env` workspace; lihat [file `.env` workspace](/id/gateway/security).

## Kebijakan DM dan kontrol akses

- `dmPolicy: "allowlist"` adalah default yang direkomendasikan.
- `allowedUserIds` menerima daftar (atau string dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` yang kosong diperlakukan sebagai salah konfigurasi dan rute Webhook tidak akan dimulai (gunakan `dmPolicy: "open"` untuk mengizinkan semua).
- `dmPolicy: "open"` mengizinkan pengirim mana pun.
- `dmPolicy: "disabled"` memblokir DM.
- Binding penerima balasan tetap menggunakan `user_id` numerik yang stabil secara default. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencocokan username/nickname yang dapat berubah untuk pengiriman balasan.
- Persetujuan pairing berfungsi dengan:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Pengiriman keluar

Gunakan ID pengguna Synology Chat numerik sebagai target.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Pengiriman media didukung melalui pengiriman file berbasis URL.
URL file keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau target lain yang diblokir akan ditolak sebelum OpenClaw meneruskan URL ke Webhook NAS.

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat menimpa token, URL incoming, path Webhook, kebijakan DM, dan limit.
Sesi pesan langsung diisolasi per akun dan pengguna, jadi `user_id` numerik yang sama
pada dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan setiap akun yang diaktifkan `webhookPath` yang berbeda. OpenClaw kini menolak path persis yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi path Webhook bersama dalam penyiapan multi-akun.
Jika Anda memang perlu inheritance lama untuk akun bernama, setel
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau pada `channels.synology-chat`,
tetapi path persis yang duplikat tetap ditolak secara fail-closed. Sebaiknya gunakan path eksplisit per akun.

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

- Jaga `token` tetap rahasia dan rotasi jika bocor.
- Biarkan `allowInsecureSsl: false` kecuali Anda secara eksplisit mempercayai sertifikat NAS lokal self-signed.
- Permintaan Webhook masuk diverifikasi dengan token dan dibatasi lajunya per pengirim.
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia waktu konstan dan gagal secara fail-closed.
- Sebaiknya gunakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` nonaktif kecuali Anda benar-benar memerlukan pengiriman balasan berbasis username lama.
- Biarkan `dangerouslyAllowInheritedWebhookPath` nonaktif kecuali Anda secara eksplisit menerima risiko routing path bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload outgoing Webhook tidak memiliki salah satu field yang diperlukan
  - jika Synology mengirim token di header, pastikan Gateway/proxy mempertahankan header tersebut
- `Invalid token`:
  - rahasia outgoing Webhook tidak cocok dengan `channels.synology-chat.token`
  - permintaan menuju akun/path Webhook yang salah
  - reverse proxy menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat mengunci sementara sumber tersebut
  - pengirim yang terautentikasi juga memiliki rate limit pesan terpisah per pengguna
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada di `allowedUserIds`

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
