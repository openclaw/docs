---
read_when:
    - Menyiapkan streaming senyap Matrix untuk Synapse atau Tuwunel yang dihosting sendiri
    - Pengguna hanya menginginkan notifikasi saat blok selesai, bukan pada setiap pengeditan pratinjau
summary: Aturan push Matrix per penerima untuk pengeditan pratinjau final secara senyap
title: Aturan push Matrix untuk pratinjau senyap
x-i18n:
    generated_at: "2026-07-12T13:59:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Ketika `channels.matrix.streaming` bernilai `"quiet"`, OpenClaw mengalirkan balasan dengan mengedit satu peristiwa pratinjau secara langsung. Pratinjau dikirim sebagai peristiwa `m.notice` tanpa notifikasi, dan edit final ditandai dengan `content["com.openclaw.finalized_preview"] = true`. Klien Matrix hanya mengirimkan notifikasi untuk edit final tersebut jika aturan push per pengguna cocok dengan penanda itu. Halaman ini ditujukan bagi operator yang meng-host Matrix sendiri dan ingin memasang aturan tersebut untuk setiap akun penerima.

`streaming: "progress"` memfinalisasi drafnya melalui jalur yang sama, sehingga aturan yang sama juga dipicu untuk edit yang difinalisasi dalam mode progres.

Jika Anda hanya menginginkan perilaku notifikasi bawaan Matrix, gunakan `streaming: "partial"` atau nonaktifkan streaming. Lihat [Penyiapan kanal Matrix](/id/channels/matrix#streaming-previews).

## Prasyarat

- pengguna penerima = orang yang seharusnya menerima notifikasi
- pengguna bot = akun Matrix OpenClaw yang mengirimkan balasan
- gunakan token akses pengguna penerima untuk panggilan API di bawah
- cocokkan `sender` dalam aturan push dengan MXID lengkap pengguna bot
- akun penerima harus sudah memiliki pusher yang berfungsi; aturan pratinjau senyap hanya berfungsi jika pengiriman push Matrix normal dalam kondisi baik

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

  <Step title="Pastikan pusher tersedia">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jika tidak ada pusher yang dikembalikan, perbaiki pengiriman push Matrix normal untuk akun ini sebelum melanjutkan.

  </Step>

  <Step title="Pasang aturan push penggantian">
    Pasang aturan yang mencocokkan penanda pratinjau yang difinalisasi beserta MXID bot sebagai pengirim:

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
    - `openclaw-finalized-preview-botname`: ID aturan yang unik untuk setiap bot dan penerima (pola: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bot OpenClaw Anda, bukan MXID penerima

  </Step>

  <Step title="Verifikasi">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Kemudian uji balasan yang dialirkan. Dalam mode senyap, ruang menampilkan pratinjau draf senyap dan mengirimkan notifikasi satu kali saat blok atau giliran selesai.

  </Step>
</Steps>

Untuk menghapus aturan tersebut nanti, kirim `DELETE` ke URL aturan yang sama dengan token penerima.

## Catatan untuk beberapa bot

Aturan push menggunakan `ruleId` sebagai kunci: menjalankan kembali `PUT` terhadap ID yang sama akan memperbarui satu aturan. Agar beberapa bot OpenClaw mengirimkan notifikasi kepada penerima yang sama, buat satu aturan untuk setiap bot dengan pencocokan pengirim yang berbeda.

Aturan `override` baru yang ditentukan pengguna disisipkan sebelum aturan penekanan bawaan server, sehingga tidak diperlukan parameter pengurutan tambahan. Aturan ini hanya memengaruhi edit pratinjau khusus teks yang dapat difinalisasi secara langsung; balasan media, fallback pratinjau usang, dan teks final yang akan mengaktifkan penyebutan Matrix dikirim sebagai pesan dengan notifikasi normal.

## Catatan homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Tidak diperlukan perubahan khusus pada `homeserver.yaml`. Jika notifikasi Matrix normal sudah mencapai pengguna ini, token penerima dan panggilan `pushrules` di atas merupakan langkah penyiapan utama.

    Jika Anda menjalankan Synapse di balik proksi terbalik atau worker, pastikan `/_matrix/client/.../pushrules/` mencapai Synapse dengan benar. Pengiriman push ditangani oleh proses utama atau `synapse.app.pusher` / worker pusher yang dikonfigurasi — pastikan semuanya dalam kondisi baik.

    Aturan ini menggunakan kondisi aturan push `event_property_is` (MSC3758, aturan push v1.10), yang ditambahkan ke Synapse pada tahun 2023. Rilis Synapse yang lebih lama menerima panggilan `PUT pushrules/...`, tetapi secara diam-diam tidak pernah mencocokkan kondisi tersebut — tingkatkan versi Synapse jika tidak ada notifikasi yang diterima pada edit pratinjau yang difinalisasi.

  </Accordion>

  <Accordion title="Tuwunel">
    Alurnya sama seperti Synapse; tidak diperlukan konfigurasi khusus Tuwunel untuk penanda pratinjau yang difinalisasi.

    Jika notifikasi menghilang saat pengguna aktif di perangkat lain, periksa apakah `suppress_push_when_active` diaktifkan. Tuwunel menambahkan opsi ini dalam versi 1.4.2 (September 2025), dan opsi ini dapat secara sengaja menekan push ke perangkat lain ketika satu perangkat sedang aktif.

  </Accordion>
</AccordionGroup>

## Terkait

- [Penyiapan kanal Matrix](/id/channels/matrix)
- [Konsep streaming](/id/concepts/streaming)
