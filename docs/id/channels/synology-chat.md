---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean webhook Synology Chat
summary: Penyiapan webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T13:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: channel pesan langsung plugin bawaan yang menggunakan webhook Synology Chat.
Plugin ini menerima pesan masuk dari webhook keluar Synology Chat dan mengirim balasan
melalui webhook masuk Synology Chat.

## Plugin bawaan

Synology Chat tersedia sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Synology Chat,
instal secara manual:

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugins](/tools/plugin)

## Penyiapan cepat

1. Pastikan plugin Synology Chat tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakan plugin ini.
   - Instalasi lama/kustom dapat menambahkannya secara manual dari checkout sumber dengan perintah di atas.
   - `openclaw onboard` sekarang menampilkan Synology Chat dalam daftar penyiapan channel yang sama seperti `openclaw channels add`.
   - Penyiapan non-interaktif: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Di integrasi Synology Chat:
   - Buat webhook masuk dan salin URL-nya.
   - Buat webhook keluar dengan token rahasia Anda.
3. Arahkan URL webhook keluar ke gateway OpenClaw Anda:
   - `https://gateway-host/webhook/synology` secara default.
   - Atau `channels.synology-chat.webhookPath` kustom Anda.
4. Selesaikan penyiapan di OpenClaw.
   - Terpandu: `openclaw onboard`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Mulai ulang gateway dan kirim DM ke bot Synology Chat.

Detail autentikasi webhook:

- OpenClaw menerima token webhook keluar dari `body.token`, lalu
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token yang kosong atau tidak ada akan gagal secara fail-closed.

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

Nilai konfigurasi menimpa variabel lingkungan.

## Kebijakan DM dan kontrol akses

- `dmPolicy: "allowlist"` adalah default yang direkomendasikan.
- `allowedUserIds` menerima daftar (atau string yang dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` yang kosong dianggap sebagai salah konfigurasi dan rute webhook tidak akan dimulai (gunakan `dmPolicy: "open"` untuk mengizinkan semua).
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

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat menimpa token, URL masuk, path webhook, kebijakan DM, dan batasan.
Sesi pesan langsung diisolasi per akun dan pengguna, sehingga `user_id` numerik yang sama
pada dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan setiap akun aktif `webhookPath` yang berbeda. OpenClaw sekarang menolak path persis yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi satu path webhook bersama dalam penyiapan multi-akun.
Jika Anda sengaja memerlukan pewarisan lama untuk akun bernama, atur
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi path persis yang duplikat tetap ditolak secara fail-closed. Lebih baik gunakan path eksplisit per akun.

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

- Jaga kerahasiaan `token` dan rotasi jika bocor.
- Pertahankan `allowInsecureSsl: false` kecuali Anda secara eksplisit memercayai sertifikat NAS lokal self-signed.
- Permintaan webhook masuk diverifikasi token dan dibatasi lajunya per pengirim.
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia waktu konstan dan fail-closed.
- Gunakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` nonaktif kecuali Anda benar-benar memerlukan pengiriman balasan berbasis username lama.
- Biarkan `dangerouslyAllowInheritedWebhookPath` nonaktif kecuali Anda secara eksplisit menerima risiko perutean path bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload webhook keluar tidak memiliki salah satu field wajib
  - jika Synology mengirim token di header, pastikan gateway/proxy mempertahankan header tersebut
- `Invalid token`:
  - rahasia webhook keluar tidak cocok dengan `channels.synology-chat.token`
  - permintaan mengenai akun/path webhook yang salah
  - reverse proxy menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat mengunci sementara sumber tersebut
  - pengirim yang terautentikasi juga memiliki batas laju pesan terpisah per pengguna
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` aktif tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada dalam `allowedUserIds`

## Terkait

- [Ikhtisar Channel](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/channels/groups) — perilaku chat grup dan penyaringan mention
- [Perutean Channel](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
