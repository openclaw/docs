---
read_when:
    - Anda ingin membaca ringkasan transkrip yang tersimpan dari terminal
    - Anda memerlukan jalur ke ringkasan transkrip dalam format Markdown
    - Anda sedang men-debug tata letak penyimpanan transkrip inti
summary: Referensi CLI untuk `openclaw transcripts` (mencantumkan, menampilkan, dan menemukan transkrip yang tersimpan)
title: CLI Transkrip
x-i18n:
    generated_at: "2026-07-20T03:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5615c3051f31f9ae38acb70c8bb00e187b987366d41b8e2049c97ba953aa35d
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Pemeriksa hanya-baca untuk transkrip yang ditulis oleh alat agen `transcripts`.
Pengambilan, impor, dan peringkasan dijalankan melalui alat tersebut, bukan CLI ini.

Artefak berada di bawah direktori status:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Direktori status default adalah `~/.openclaw`; timpa dengan `OPENCLAW_STATE_DIR`.
Direktori tanggal berasal dari waktu mulai sesi; direktori sesi adalah
slug yang aman untuk sistem berkas dan berasal dari id sesi.

## Perintah

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Perintah                      | Deskripsi                                              |
| ----------------------------- | ------------------------------------------------------ |
| `list`            | Cantumkan sesi yang tersimpan.                         |
| `show <session>`            | Cetak `summary.md` yang tersimpan.               |
| `path <session>`            | Cetak jalur `summary.md`.                        |
| `path <session> --dir`            | Cetak direktori sesi.                                  |
| `path <session> --metadata`            | Cetak `metadata.json`.                              |
| `path <session> --transcript`            | Cetak `transcript.jsonl`.                              |
| `--json`            | Cetak keluaran yang dapat dibaca mesin (semua subperintah). |

`<session>` menerima id sesi tanpa kualifikasi atau pemilih yang dilengkapi tanggal
(`YYYY-MM-DD/<session>`). Gunakan bentuk yang dilengkapi tanggal saat id sesi yang sama
muncul pada lebih dari satu hari, misalnya `openclaw transcripts show
2026-05-22/standup`. Id sesi default mencakup stempel waktu dan
akhiran acak; berikan id tetap kepada sesi hanya jika id tersebut unik dalam hari itu.

## Keluaran

`list` mencetak satu baris yang dipisahkan tab per sesi: pemilih, waktu mulai, judul,
jalur ringkasan.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Rapat mingguan  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Pemilih adalah nilai teraman untuk diteruskan kembali ke `show` atau `path`.

`list --json` mengembalikan objek dengan `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` mengembalikan metadata sesi yang tersimpan, pemilih, direktori
sesi, jalur ringkasan, dan teks Markdown ringkasan.

`path --json` mengembalikan jalur yang dipilih dan informasi apakah berkas tersebut ada.

## Banyak sesi per hari

Sesi dikelompokkan berdasarkan tanggal, lalu berdasarkan id sesi. Sepuluh rapat dalam satu hari menjadi
sepuluh folder sejajar:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Gunakan id bawaan yang dibuat secara otomatis untuk otomatisasi. Gunakan id tetap seperti `standup` hanya
jika id tersebut tidak akan berulang pada tanggal yang sama.

## Ringkasan yang hilang

Sesi langsung menulis `summary.md` saat sesi berhenti; transkrip yang diimpor
langsung menulisnya setelah impor. Sesi dapat muncul di `list` tanpa
ringkasan ketika pengambilan masih aktif, jika penyedia gagal saat penghentian, atau jika
metadata ditulis sebelum ujaran apa pun diterima.

Gunakan `path <session> --transcript` untuk memeriksa transkrip mentah yang hanya dapat ditambahkan,
atau jalankan tindakan `summarize` dari alat `transcripts` untuk membuat ulang ringkasan
Markdown.

## Konfigurasi

Pengambilan bersifat opsional (sumber langsung dapat bergabung dan merekam audio rapat). Aktifkan
dengan:

```json
{
  "transcripts": {
    "enabled": true
  }
}
```

- `enabled` (default `false`): aktifkan alat.
  Konfigurasikan sumber mulai otomatis dengan `transcripts.autoStart`. Setiap entri
  diaktifkan dengan keberadaannya; hilangkan entri untuk menonaktifkan sumber tersebut. `discord-voice`
  adalah sumber bawaan yang mendukung mulai otomatis dan memerlukan `guildId` serta
  `channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
