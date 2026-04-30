---
read_when:
    - Menyiapkan streaming senyap Matrix untuk Synapse atau Tuwunel yang di-hosting sendiri
    - Pengguna menginginkan notifikasi hanya untuk blok yang selesai, bukan untuk setiap pengeditan pratinjau
summary: Aturan push Matrix per penerima untuk edit pratinjau yang difinalisasi secara senyap
title: Aturan push Matrix untuk pratinjau senyap
x-i18n:
    generated_at: "2026-04-30T09:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Saat `channels.matrix.streaming` bernilai `"quiet"`, OpenClaw mengedit satu event pratinjau di tempat dan menandai edit final dengan flag konten khusus. Klien Matrix memberi notifikasi pada edit final hanya jika aturan push per pengguna cocok dengan flag tersebut. Halaman ini ditujukan untuk operator yang meng-host Matrix sendiri dan ingin memasang aturan tersebut untuk setiap akun penerima.

Jika Anda hanya menginginkan perilaku notifikasi Matrix bawaan, gunakan `streaming: "partial"` atau biarkan streaming nonaktif. Lihat [Penyiapan channel Matrix](/id/channels/matrix#streaming-previews).

## Prasyarat

- pengguna penerima = orang yang harus menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan token akses pengguna penerima untuk panggilan API di bawah ini
- cocokkan `sender` dalam aturan push dengan MXID lengkap pengguna bot
- akun penerima harus sudah memiliki pusher yang berfungsi — aturan pratinjau senyap hanya berfungsi ketika pengiriman push Matrix normal sehat

## Langkah-langkah

<Steps>
  <Step title="Konfigurasikan pratinjau senyap">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Dapatkan token akses penerima">
    Gunakan kembali token sesi klien yang sudah ada jika memungkinkan. Untuk membuat yang baru:

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

  <Step title="Verifikasi pusher ada">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika tidak ada pusher yang kembali, perbaiki pengiriman push Matrix normal untuk akun ini sebelum melanjutkan.

  </Step>

  <Step title="Pasang aturan push override">
    OpenClaw menandai edit pratinjau final khusus teks dengan `content["com.openclaw.finalized_preview"] = true`. Pasang aturan yang mencocokkan penanda tersebut beserta MXID bot sebagai pengirim:

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
    - `openclaw-finalized-preview-botname`: ID aturan yang unik per bot per penerima (pola: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bot OpenClaw Anda, bukan milik penerima

  </Step>

  <Step title="Verifikasi">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Lalu uji balasan yang di-stream. Dalam mode senyap, room menampilkan pratinjau draf senyap dan memberi notifikasi setelah blok atau giliran selesai.

  </Step>
</Steps>

Untuk menghapus aturan nanti, lakukan `DELETE` pada URL aturan yang sama dengan token penerima.

## Catatan multi-bot

Aturan push dikunci berdasarkan `ruleId`: menjalankan ulang `PUT` terhadap ID yang sama memperbarui satu aturan. Untuk beberapa bot OpenClaw yang memberi notifikasi ke penerima yang sama, buat satu aturan per bot dengan pencocokan pengirim yang berbeda.

Aturan `override` baru yang ditentukan pengguna disisipkan sebelum aturan penekanan default, jadi tidak diperlukan parameter pengurutan tambahan. Aturan ini hanya memengaruhi edit pratinjau khusus teks yang dapat difinalisasi di tempat; fallback media dan fallback pratinjau usang menggunakan pengiriman Matrix normal.

## Catatan homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Tidak diperlukan perubahan khusus pada `homeserver.yaml`. Jika notifikasi Matrix normal sudah sampai ke pengguna ini, token penerima + panggilan `pushrules` di atas adalah langkah penyiapan utama.

    Jika Anda menjalankan Synapse di belakang reverse proxy atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi — pastikan semuanya sehat.

    Aturan ini menggunakan kondisi aturan push `event_property_is` (MSC3758, aturan push v1.10), yang ditambahkan ke Synapse pada 2023. Rilis Synapse yang lebih lama menerima panggilan `PUT pushrules/...` tetapi diam-diam tidak pernah mencocokkan kondisi tersebut — tingkatkan Synapse jika tidak ada notifikasi yang tiba pada edit pratinjau final.

  </Accordion>

  <Accordion title="Tuwunel">
    Alur yang sama seperti Synapse; tidak diperlukan konfigurasi khusus Tuwunel untuk penanda pratinjau final.

    Jika notifikasi menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini pada 1.4.2 (September 2025) dan opsi ini dapat dengan sengaja menekan push ke perangkat lain saat satu perangkat aktif.

  </Accordion>
</AccordionGroup>

## Terkait

- [Penyiapan channel Matrix](/id/channels/matrix)
- [Konsep streaming](/id/concepts/streaming)
