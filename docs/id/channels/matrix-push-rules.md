---
read_when:
    - Menyiapkan streaming senyap Matrix untuk Synapse atau Tuwunel yang di-host sendiri
    - Pengguna hanya menginginkan notifikasi pada blok yang sudah selesai, bukan pada setiap edit pratinjau
summary: Aturan push Matrix per penerima untuk edit pratinjau final yang senyap
title: Aturan push Matrix untuk pratinjau senyap
x-i18n:
    generated_at: "2026-04-24T08:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Saat `channels.matrix.streaming` bernilai `"quiet"`, OpenClaw mengedit satu event pratinjau di tempat dan menandai edit yang telah difinalkan dengan flag konten kustom. Klien Matrix hanya memberi notifikasi pada edit final jika aturan push per pengguna cocok dengan flag tersebut. Halaman ini ditujukan bagi operator yang meng-host Matrix sendiri dan ingin memasang aturan tersebut untuk setiap akun penerima.

Jika Anda hanya menginginkan perilaku notifikasi Matrix bawaan, gunakan `streaming: "partial"` atau biarkan streaming tetap nonaktif. Lihat [penyiapan channel Matrix](/id/channels/matrix#streaming-previews).

## Prasyarat

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirim balasan
- gunakan access token milik pengguna penerima untuk panggilan API di bawah
- cocokkan `sender` di aturan push dengan MXID lengkap milik pengguna bot
- akun penerima harus sudah memiliki pusher yang berfungsi — aturan pratinjau senyap hanya berfungsi jika pengiriman push Matrix normal sudah sehat

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

  <Step title="Dapatkan access token penerima">
    Gunakan kembali token sesi klien yang sudah ada jika memungkinkan. Untuk membuat token baru:

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

  <Step title="Verifikasi bahwa pusher ada">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika tidak ada pusher yang dikembalikan, perbaiki pengiriman push Matrix normal untuk akun ini sebelum melanjutkan.

  </Step>

  <Step title="Pasang aturan push override">
    OpenClaw menandai edit pratinjau final yang hanya berisi teks dengan `content["com.openclaw.finalized_preview"] = true`. Pasang aturan yang cocok dengan penanda tersebut ditambah MXID bot sebagai pengirim:

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
    - `$USER_ACCESS_TOKEN`: access token milik pengguna penerima
    - `openclaw-finalized-preview-botname`: ID aturan yang unik per bot per penerima (pola: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bot OpenClaw Anda, bukan milik penerima

  </Step>

  <Step title="Verifikasi">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Kemudian uji balasan streaming. Dalam mode quiet, ruang menampilkan pratinjau draf senyap dan memberi notifikasi satu kali saat blok atau giliran selesai.

  </Step>
</Steps>

Untuk menghapus aturan nanti, lakukan `DELETE` ke URL aturan yang sama dengan token milik penerima.

## Catatan multi-bot

Aturan push dikunci berdasarkan `ruleId`: menjalankan ulang `PUT` terhadap ID yang sama akan memperbarui satu aturan. Untuk beberapa bot OpenClaw yang memberi notifikasi ke penerima yang sama, buat satu aturan per bot dengan kecocokan pengirim yang berbeda.

Aturan `override` buatan pengguna yang baru dimasukkan di depan aturan penekanan default, jadi tidak diperlukan parameter pengurutan tambahan. Aturan ini hanya memengaruhi edit pratinjau yang hanya berisi teks dan dapat difinalkan di tempat; fallback media dan fallback pratinjau usang menggunakan pengiriman Matrix normal.

## Catatan homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Tidak diperlukan perubahan khusus pada `homeserver.yaml`. Jika notifikasi Matrix normal sudah mencapai pengguna ini, token penerima + panggilan `pushrules` di atas adalah langkah penyiapan utama.

    Jika Anda menjalankan Synapse di balik reverse proxy atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi — pastikan semuanya sehat.

  </Accordion>

  <Accordion title="Tuwunel">
    Alurnya sama seperti Synapse; tidak diperlukan konfigurasi khusus Tuwunel untuk penanda pratinjau final.

    Jika notifikasi menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini di 1.4.2 (September 2025) dan opsi ini dapat secara sengaja menekan push ke perangkat lain saat satu perangkat sedang aktif.

  </Accordion>
</AccordionGroup>

## Terkait

- [penyiapan channel Matrix](/id/channels/matrix)
- [konsep streaming](/id/concepts/streaming)
