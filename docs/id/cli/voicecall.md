---
read_when:
    - Anda menggunakan Plugin voice-call dan menginginkan setiap titik masuk CLI
    - Anda memerlukan tabel flag dan nilai default untuk setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose, dan start
summary: Referensi CLI untuk `openclaw voicecall` (permukaan perintah Plugin panggilan suara)
title: Panggilan suara
x-i18n:
    generated_at: "2026-05-10T19:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw voicecall`

`voicecall` adalah perintah yang disediakan Plugin. Perintah ini hanya muncul ketika Plugin panggilan suara terinstal dan diaktifkan.

Ketika Gateway berjalan, perintah operasional (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) dirutekan ke runtime panggilan suara Gateway tersebut. Jika tidak ada Gateway yang dapat dijangkau, perintah tersebut beralih ke runtime CLI mandiri.

## Subperintah

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| Subperintah | Deskripsi                                                       |
| ----------- | --------------------------------------------------------------- |
| `setup`     | Menampilkan pemeriksaan kesiapan penyedia dan Webhook.          |
| `smoke`     | Menjalankan pemeriksaan kesiapan; melakukan panggilan uji langsung hanya dengan `--yes`. |
| `call`      | Memulai panggilan suara keluar.                                 |
| `start`     | Alias untuk `call` dengan `--to` wajib dan `--message` opsional. |
| `continue`  | Mengucapkan pesan dan menunggu respons berikutnya.              |
| `speak`     | Mengucapkan pesan tanpa menunggu respons.                       |
| `dtmf`      | Mengirim digit DTMF ke panggilan aktif.                         |
| `end`       | Menutup panggilan aktif.                                        |
| `status`    | Memeriksa panggilan aktif (atau satu panggilan berdasarkan `--call-id`). |
| `tail`      | Memantau `calls.jsonl` (berguna selama pengujian penyedia).     |
| `latency`   | Merangkum metrik latensi giliran dari `calls.jsonl`.            |
| `expose`    | Mengaktifkan atau menonaktifkan Tailscale serve/funnel untuk endpoint Webhook. |

## Penyiapan dan smoke

### `setup`

Secara default mencetak pemeriksaan kesiapan yang mudah dibaca manusia. Gunakan `--json` untuk skrip.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

Menjalankan pemeriksaan kesiapan yang sama. Ini tidak akan melakukan panggilan telepon nyata kecuali `--to` dan `--yes` sama-sama ada.

| Flag               | Default                           | Deskripsi                              |
| ------------------ | --------------------------------- | -------------------------------------- |
| `-t, --to <phone>` | (tidak ada)                       | Nomor telepon yang akan dipanggil untuk smoke langsung. |
| `--message <text>` | `OpenClaw voice call smoke test.` | Pesan yang diucapkan selama panggilan smoke. |
| `--mode <mode>`    | `notify`                          | Mode panggilan: `notify` atau `conversation`. |
| `--yes`            | `false`                           | Benar-benar melakukan panggilan keluar langsung. |
| `--json`           | `false`                           | Mencetak JSON yang dapat dibaca mesin. |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
Untuk penyedia eksternal (`twilio`, `telnyx`, `plivo`), `setup` dan `smoke` memerlukan URL Webhook publik dari `publicUrl`, tunnel, atau eksposur Tailscale. Fallback loopback atau serve privat ditolak karena operator tidak dapat menjangkaunya.
</Note>

## Siklus hidup panggilan

### `call`

Memulai panggilan suara keluar.

| Flag                   | Wajib | Default           | Deskripsi                                                                  |
| ---------------------- | ----- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | ya    | (tidak ada)       | Pesan yang diucapkan saat panggilan terhubung.                             |
| `-t, --to <phone>`     | tidak | config `toNumber` | Nomor telepon E.164 yang akan dipanggil.                                   |
| `--mode <mode>`        | tidak | `conversation`    | Mode panggilan: `notify` (tutup setelah pesan) atau `conversation` (tetap terbuka). |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

Alias untuk `call` dengan bentuk flag default yang berbeda.

| Flag               | Wajib | Default        | Deskripsi                                      |
| ------------------ | ----- | -------------- | ---------------------------------------------- |
| `--to <phone>`     | ya    | (tidak ada)    | Nomor telepon yang akan dipanggil.             |
| `--message <text>` | tidak | (tidak ada)    | Pesan yang diucapkan saat panggilan terhubung. |
| `--mode <mode>`    | tidak | `conversation` | Mode panggilan: `notify` atau `conversation`.  |

### `continue`

Mengucapkan pesan dan menunggu respons.

| Flag               | Wajib | Deskripsi             |
| ------------------ | ----- | --------------------- |
| `--call-id <id>`   | ya    | ID panggilan.         |
| `--message <text>` | ya    | Pesan yang diucapkan. |

### `speak`

Mengucapkan pesan tanpa menunggu respons.

| Flag               | Wajib | Deskripsi             |
| ------------------ | ----- | --------------------- |
| `--call-id <id>`   | ya    | ID panggilan.         |
| `--message <text>` | ya    | Pesan yang diucapkan. |

### `dtmf`

Mengirim digit DTMF ke panggilan aktif.

| Flag                | Wajib | Deskripsi                                  |
| ------------------- | ----- | ------------------------------------------ |
| `--call-id <id>`    | ya    | ID panggilan.                              |
| `--digits <digits>` | ya    | Digit DTMF (mis. `ww123456#` untuk jeda).  |

### `end`

Menutup panggilan aktif.

| Flag             | Wajib | Deskripsi     |
| ---------------- | ----- | ------------- |
| `--call-id <id>` | ya    | ID panggilan. |

### `status`

Memeriksa panggilan aktif.

| Flag             | Default     | Deskripsi                               |
| ---------------- | ----------- | --------------------------------------- |
| `--call-id <id>` | (tidak ada) | Membatasi output ke satu panggilan.     |
| `--json`         | `false`     | Mencetak JSON yang dapat dibaca mesin.  |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## Log dan metrik

### `tail`

Memantau log JSONL panggilan suara. Mencetak `--since` baris terakhir saat mulai, lalu mengalirkan baris baru saat ditulis.

| Flag            | Default                         | Deskripsi                              |
| --------------- | ------------------------------- | -------------------------------------- |
| `--file <path>` | diselesaikan dari store Plugin  | Path ke `calls.jsonl`.                 |
| `--since <n>`   | `25`                            | Baris yang dicetak sebelum memantau.   |
| `--poll <ms>`   | `250` (minimum 50)              | Interval polling dalam milidetik.      |

### `latency`

Merangkum metrik latensi giliran dan tunggu-dengar dari `calls.jsonl`. Output berupa JSON dengan ringkasan `recordsScanned`, `turnLatency`, dan `listenWait`.

| Flag            | Default                         | Deskripsi                                |
| --------------- | ------------------------------- | ---------------------------------------- |
| `--file <path>` | diselesaikan dari store Plugin  | Path ke `calls.jsonl`.                   |
| `--last <n>`    | `200` (minimum 1)               | Jumlah catatan terbaru untuk dianalisis. |

## Mengekspos Webhook

### `expose`

Mengaktifkan, menonaktifkan, atau mengubah konfigurasi Tailscale serve/funnel untuk Webhook suara.

| Flag                  | Default                                   | Deskripsi                                      |
| --------------------- | ----------------------------------------- | ---------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet), atau `funnel` (publik). |
| `--path <path>`       | config `tailscale.path` atau `--serve-path` | Path Tailscale yang akan diekspos.           |
| `--port <port>`       | config `serve.port` atau `3334`           | Port Webhook lokal.                            |
| `--serve-path <path>` | config `serve.path` atau `/voice/webhook` | Path Webhook lokal.                            |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Ekspos endpoint Webhook hanya ke jaringan yang Anda percayai. Utamakan Tailscale Serve daripada Funnel jika memungkinkan.
</Warning>

## Terkait

- [Referensi CLI](/id/cli)
- [Plugin panggilan suara](/id/plugins/voice-call)
