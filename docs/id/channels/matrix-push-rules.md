---
read_when:
    - Menyiapkan streaming senyap Matrix untuk Synapse atau Tuwunel yang di-host sendiri
    - Pengguna menginginkan notifikasi hanya untuk blok yang telah selesai, bukan untuk setiap pengeditan pratinjau
summary: Aturan push Matrix per penerima untuk pengeditan pratinjau final tanpa notifikasi
title: Aturan push Matrix untuk pratinjau senyap
x-i18n:
    generated_at: "2026-07-16T17:51:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Ketika `channels.matrix.streaming.mode` adalah `"quiet"`, OpenClaw mengalirkan balasan dengan mengedit satu peristiwa pratinjau secara langsung. Pratinjau dikirim sebagai peristiwa `m.notice` yang tidak memicu notifikasi, dan hasil edit yang telah difinalisasi ditandai dengan `content["com.openclaw.finalized_preview"] = true`. Klien Matrix hanya memicu notifikasi pada hasil edit akhir tersebut jika aturan push per pengguna cocok dengan penanda itu. Halaman ini ditujukan bagi operator yang menghosting Matrix sendiri dan ingin memasang aturan tersebut untuk setiap akun penerima.

`streaming.mode: "progress"` memfinalisasi drafnya melalui jalur yang sama, sehingga aturan yang sama juga dipicu untuk hasil edit yang difinalisasi dalam mode progres.

Jika Anda hanya menginginkan perilaku notifikasi Matrix standar, gunakan `streaming.mode: "partial"` atau biarkan streaming nonaktif. Lihat [penyiapan saluran Matrix](/id/channels/matrix#streaming-previews).

## Prasyarat

- pengguna penerima = orang yang harus menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirimkan balasan
- gunakan token akses pengguna penerima untuk panggilan API di bawah ini
- cocokkan `sender` dalam aturan push dengan MXID lengkap pengguna bot
- akun penerima harus sudah memiliki pusher yang berfungsi; aturan pratinjau senyap hanya berfungsi jika pengiriman push Matrix normal dalam kondisi baik

## Langkah-langkah

<Steps>
  <Step title="Konfigurasikan pratinjau senyap">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Dapatkan token akses penerima">
    Gunakan kembali token sesi klien yang ada jika memungkinkan. Untuk membuat token baru:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Verifikasi keberadaan pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika tidak ada pusher yang dikembalikan, perbaiki pengiriman push Matrix normal untuk akun ini sebelum melanjutkan.

  </Step>

  <Step title="Pasang aturan push override">
    Pasang aturan yang mencocokkan penanda pratinjau yang telah difinalisasi beserta MXID bot sebagai pengirim:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Ganti sebelum menjalankan:

    - `https://matrix.example.org`: URL dasar homeserver Anda
    - `$USER_ACCESS_TOKEN`: token akses pengguna penerima
    - `openclaw-finalized-preview-botname`: ID aturan yang unik untuk setiap bot per penerima (pola: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bot OpenClaw Anda, bukan MXID penerima

  </Step>

  <Step title="Verifikasi">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Kemudian uji balasan yang dialirkan. Dalam mode senyap, ruang menampilkan pratinjau draf senyap dan mengirimkan notifikasi satu kali ketika blok atau giliran selesai.

  </Step>
</Steps>

Untuk menghapus aturan tersebut nanti, `DELETE` URL aturan yang sama dengan token penerima.

## Catatan untuk beberapa bot

Aturan push dikunci berdasarkan `ruleId`: menjalankan kembali `PUT` terhadap ID yang sama akan memperbarui satu aturan. Agar beberapa bot OpenClaw mengirimkan notifikasi kepada penerima yang sama, buat satu aturan per bot dengan pencocokan pengirim yang berbeda.

Aturan `override` baru yang ditentukan pengguna disisipkan sebelum aturan penekanan bawaan server, sehingga tidak diperlukan parameter pengurutan tambahan. Aturan ini hanya memengaruhi hasil edit pratinjau khusus teks yang dapat difinalisasi secara langsung; balasan media, fallback pratinjau kedaluwarsa, dan teks akhir yang akan mengaktifkan sebutan Matrix dikirim sebagai pesan biasa yang memicu notifikasi.

## Catatan homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Tidak diperlukan perubahan khusus pada `homeserver.yaml`. Jika notifikasi Matrix normal sudah diterima pengguna ini, token penerima + panggilan `pushrules` di atas merupakan langkah penyiapan utama.

    Jika Anda menjalankan Synapse di belakang proksi terbalik atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi — pastikan semuanya dalam kondisi baik.

    Aturan ini menggunakan kondisi aturan push `event_property_is` (MSC3758, aturan push v1.10), yang ditambahkan ke Synapse pada 2023. Rilis Synapse yang lebih lama menerima panggilan `PUT pushrules/...`, tetapi secara diam-diam tidak pernah mencocokkan kondisi tersebut — tingkatkan versi Synapse jika tidak ada notifikasi yang diterima pada hasil edit pratinjau yang telah difinalisasi.

  </Accordion>

  <Accordion title="Tuwunel">
    Alurnya sama seperti Synapse; tidak diperlukan konfigurasi khusus Tuwunel untuk penanda pratinjau yang telah difinalisasi.

    Jika notifikasi menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini pada 1.4.2 (September 2025), dan opsi tersebut dapat secara sengaja menekan push ke perangkat lain saat satu perangkat sedang aktif.

  </Accordion>
</AccordionGroup>

## Terkait

- [Penyiapan saluran Matrix](/id/channels/matrix)
- [Konsep streaming](/id/concepts/streaming)
