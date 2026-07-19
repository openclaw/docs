---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean webhook Synology Chat
summary: Penyiapan webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-19T04:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c03379944ee4187260a7287f6d2aed1ad8fdd1c22b5581c8a5d55515bbb6ad5
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat terhubung ke OpenClaw melalui sepasang webhook: webhook keluar Synology Chat mengirimkan pesan langsung masuk ke Gateway, dan balasan dikirim kembali melalui webhook masuk Synology Chat.

Status: plugin resmi, diinstal secara terpisah. Hanya pesan langsung; pengiriman teks dan file berbasis URL didukung.

## Instalasi

```bash
openclaw plugins install @openclaw/synology-chat
```

Checkout lokal (saat dijalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

1. Instal plugin (di atas).
2. Di integrasi Synology Chat:
   - Buat webhook masuk dan salin URL-nya.
   - Buat webhook keluar dengan token rahasia Anda.
3. Arahkan URL webhook keluar ke Gateway OpenClaw Anda:
   - `https://gateway-host/webhook/synology` secara default.
   - Atau `channels.synology-chat.webhookPath` khusus Anda.
4. Selesaikan penyiapan di OpenClaw. Synology Chat muncul dalam daftar penyiapan saluran yang sama pada kedua alur:
   - Terpandu: `openclaw onboard` atau `openclaw channels add`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Mulai ulang Gateway dan kirim pesan langsung kepada bot Synology Chat.

Detail autentikasi webhook:

- OpenClaw menerima token webhook keluar dari `body.token`, kemudian
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token kosong atau tidak ada akan ditolak secara tertutup.
- Payload dapat berupa `application/x-www-form-urlencoded` atau `application/json`; `token`, `user_id`, dan `text` wajib tersedia.

## Ketahanan pesan masuk

Setelah pemeriksaan token, kebijakan pengirim, dan batas laju berhasil, OpenClaw menghapus token webhook dari amplop yang disimpan dan memasukkan peristiwa secara persisten ke antrean sebelum mengakuinya. Rute mengembalikan `204` hanya setelah penambahan tersebut berhasil; kegagalan persistensi mengembalikan `503` agar Synology Chat dapat mencoba lagi alih-alih kehilangan pesan secara diam-diam.

Peristiwa yang tertunda atau dapat dicoba ulang tetap tersedia setelah Gateway dimulai ulang. `post_id` stabil milik Synology mencegah entri antrean duplikat selama catatan penyelesaian aktif atau yang dipertahankan terkait masih ada. Pengiriman tetap dilakukan setidaknya satu kali sepanjang serah terima dari antrean ke agen, sehingga kegagalan pada batas tersebut masih dapat memutar ulang satu giliran.

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

Nilai konfigurasi menggantikan variabel lingkungan.

`SYNOLOGY_CHAT_INCOMING_URL` dan `SYNOLOGY_NAS_HOST` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [File `.env` ruang kerja](/id/gateway/security#workspace-env-files).

## Kebijakan pesan langsung dan kontrol akses

- Nilai `dmPolicy` yang didukung: `allowlist` (default), `open`, dan `disabled`. Synology Chat tidak memiliki alur pemasangan; setujui pengirim dengan menambahkan ID pengguna numerik Synology mereka ke `allowedUserIds`.
- `allowedUserIds` menerima daftar (atau string yang dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` yang kosong dianggap sebagai kesalahan konfigurasi dan rute webhook tidak akan dimulai.
- `dmPolicy: "open"` mengizinkan pesan langsung publik hanya jika `allowedUserIds` menyertakan `"*"`; dengan entri yang membatasi, hanya pengguna yang cocok yang dapat mengobrol. `open` dengan daftar `allowedUserIds` kosong juga menolak memulai rute.
- `dmPolicy: "disabled"` memblokir pesan langsung.
- Pengikatan penerima balasan secara default tetap menggunakan `user_id` numerik yang stabil. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas darurat yang mengaktifkan kembali pencarian nama pengguna/nama panggilan yang dapat berubah untuk pengiriman balasan.

## Pengiriman keluar

Gunakan ID pengguna numerik Synology Chat sebagai target. Awalan `synology-chat:`, `synology_chat:`, dan `synology:` diterima.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Halo dari OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Halo lagi"
openclaw message send --channel synology-chat --target synology:123456 --message "Awalan singkat"
```

Teks keluar dibagi menjadi bagian-bagian sepanjang 2000 karakter. Pengiriman media didukung melalui pengiriman file berbasis URL: NAS mengunduh dan melampirkan file (maks. 32 MB). URL file keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau yang diblokir akan ditolak sebelum OpenClaw meneruskan URL tersebut ke webhook NAS.

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat mengganti token, URL masuk, jalur webhook, kebijakan pesan langsung, dan batas.
Sesi pesan langsung diisolasi berdasarkan akun dan pengguna, sehingga `user_id` numerik yang sama
pada dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan `webhookPath` yang berbeda untuk setiap akun yang diaktifkan. OpenClaw menolak jalur identik yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi jalur webhook bersama dalam penyiapan multi-akun.
Jika Anda memang memerlukan pewarisan lama untuk akun bernama, tetapkan
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi jalur identik yang duplikat tetap ditolak secara tertutup. Utamakan jalur eksplisit per akun.

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
- Permintaan webhook masuk diverifikasi menggunakan token dan dibatasi lajunya per pengirim (`rateLimitPerMinute`, default 30).
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia dengan waktu konstan dan menolak secara tertutup; percobaan token tidak valid yang berulang akan memblokir alamat IP sumber untuk sementara.
- Teks pesan masuk disanitasi terhadap pola injeksi prompt yang diketahui dan dipangkas pada 4000 karakter.
- Utamakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` nonaktif kecuali Anda secara eksplisit memerlukan pengiriman balasan lama berbasis nama pengguna.
- Biarkan `dangerouslyAllowInheritedWebhookPath` nonaktif kecuali Anda secara eksplisit menerima risiko perutean jalur bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload webhook keluar tidak memiliki salah satu bidang yang diwajibkan
  - jika Synology mengirim token dalam header, pastikan gateway/proksi mempertahankan header tersebut
- `Invalid token`:
  - rahasia webhook keluar tidak cocok dengan `channels.synology-chat.token`
  - permintaan mencapai jalur akun/webhook yang salah
  - proksi balik menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat memblokir sumber tersebut untuk sementara
  - pengirim terautentikasi juga memiliki batas laju pesan per pengguna yang terpisah
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik milik pengirim tidak terdapat dalam `allowedUserIds`

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
