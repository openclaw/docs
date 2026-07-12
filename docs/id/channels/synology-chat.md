---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean Webhook Synology Chat
summary: Penyiapan webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T13:57:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat terhubung ke OpenClaw melalui sepasang Webhook: Webhook keluar Synology Chat mengirim pesan langsung masuk ke Gateway, dan balasan dikirim kembali melalui Webhook masuk Synology Chat.

Status: Plugin resmi, diinstal secara terpisah. Hanya pesan langsung; pengiriman teks dan berkas berbasis URL didukung.

## Instalasi

```bash
openclaw plugins install @openclaw/synology-chat
```

Checkout lokal (saat dijalankan dari repositori git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Instal Plugin (di atas).
2. Di integrasi Synology Chat:
   - Buat Webhook masuk dan salin URL-nya.
   - Buat Webhook keluar dengan token rahasia Anda.
3. Arahkan URL Webhook keluar ke Gateway OpenClaw Anda:
   - Secara bawaan, `https://gateway-host/webhook/synology`.
   - Atau `channels.synology-chat.webhookPath` khusus Anda.
4. Selesaikan penyiapan di OpenClaw. Synology Chat muncul dalam daftar penyiapan kanal yang sama di kedua alur:
   - Terpandu: `openclaw onboard` atau `openclaw channels add`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Mulai ulang Gateway dan kirim pesan langsung kepada bot Synology Chat.

Detail autentikasi Webhook:

- OpenClaw menerima token Webhook keluar dari `body.token`, kemudian
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token kosong atau tidak ada akan ditolak secara tertutup.
- Muatan dapat berupa `application/x-www-form-urlencoded` atau `application/json`; `token`, `user_id`, dan `text` wajib ada.

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

Untuk akun bawaan, Anda dapat menggunakan variabel lingkungan:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (dipisahkan koma)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Nilai konfigurasi mengesampingkan variabel lingkungan.

`SYNOLOGY_CHAT_INCOMING_URL` dan `SYNOLOGY_NAS_HOST` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [Berkas `.env` ruang kerja](/id/gateway/security#workspace-env-files).

## Kebijakan pesan langsung dan kontrol akses

- Nilai `dmPolicy` yang didukung: `allowlist` (bawaan), `open`, dan `disabled`. Synology Chat tidak memiliki alur pemasangan; setujui pengirim dengan menambahkan ID pengguna numerik Synology mereka ke `allowedUserIds`.
- `allowedUserIds` menerima daftar (atau string yang dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` yang kosong dianggap sebagai kesalahan konfigurasi dan rute Webhook tidak akan dimulai.
- `dmPolicy: "open"` mengizinkan pesan langsung publik hanya jika `allowedUserIds` menyertakan `"*"`; dengan entri yang membatasi, hanya pengguna yang cocok yang dapat mengobrol. `open` dengan daftar `allowedUserIds` kosong juga menolak memulai rute.
- `dmPolicy: "disabled"` memblokir pesan langsung.
- Pengikatan penerima balasan secara bawaan tetap menggunakan `user_id` numerik yang stabil. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencarian nama pengguna/nama panggilan yang dapat berubah untuk pengiriman balasan.

## Pengiriman keluar

Gunakan ID pengguna Synology Chat numerik sebagai target. Prefiks `synology-chat:`, `synology_chat:`, dan `synology:` diterima.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Teks keluar dipecah pada batas 2.000 karakter. Pengiriman media didukung melalui pengiriman berkas berbasis URL: NAS mengunduh dan melampirkan berkas (maks. 32 MB). URL berkas keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau yang diblokir akan ditolak sebelum OpenClaw meneruskan URL tersebut ke Webhook NAS.

## Multiakun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat mengesampingkan token, URL masuk, jalur Webhook, kebijakan pesan langsung, dan batas.
Sesi pesan langsung diisolasi per akun dan pengguna, sehingga `user_id` numerik yang sama
pada dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan `webhookPath` yang berbeda untuk setiap akun yang diaktifkan. OpenClaw menolak jalur persis yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi jalur Webhook bersama dalam penyiapan multiakun.
Jika Anda sengaja memerlukan pewarisan lama untuk akun bernama, tetapkan
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi jalur persis yang duplikat tetap ditolak secara tertutup. Utamakan jalur eksplisit per akun.

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
- Permintaan Webhook masuk diverifikasi dengan token dan dibatasi lajunya per pengirim (`rateLimitPerMinute`, bawaan 30).
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia dengan waktu konstan dan ditolak secara tertutup; percobaan token tidak valid berulang kali akan memblokir sementara alamat IP sumber.
- Teks pesan masuk dibersihkan dari pola injeksi perintah yang diketahui dan dipotong pada 4.000 karakter.
- Utamakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` dinonaktifkan kecuali Anda secara eksplisit memerlukan pengiriman balasan lama berbasis nama pengguna.
- Biarkan `dangerouslyAllowInheritedWebhookPath` dinonaktifkan kecuali Anda secara eksplisit menerima risiko perutean jalur bersama dalam penyiapan multiakun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - muatan Webhook keluar tidak memiliki salah satu bidang wajib
  - jika Synology mengirim token dalam header, pastikan Gateway/proksi mempertahankan header tersebut
- `Invalid token`:
  - rahasia Webhook keluar tidak cocok dengan `channels.synology-chat.token`
  - permintaan mencapai akun/jalur Webhook yang salah
  - proksi balik menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat memblokir sumber tersebut untuk sementara
  - pengirim terautentikasi juga memiliki batas laju pesan per pengguna yang terpisah
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada dalam `allowedUserIds`

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan sebutan
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
