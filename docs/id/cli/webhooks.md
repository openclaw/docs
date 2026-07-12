---
read_when:
    - Anda ingin menghubungkan peristiwa Pub/Sub Gmail ke OpenClaw
    - Anda memerlukan daftar lengkap flag dan nilai defaultnya
summary: Referensi CLI untuk `openclaw webhooks` (penyiapan dan pelaksana Pub/Sub Gmail)
title: Webhook
x-i18n:
    generated_at: "2026-07-12T14:08:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Pembantu dan integrasi Webhook. Saat ini, cakupan fitur ini terbatas pada alur Gmail Pub/Sub yang dibangun di atas pemantau `gog` bawaan.

## Subperintah

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Subperintah   | Deskripsi                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------- |
| `gmail setup` | Panduan satu kali: pemantauan Gmail, topik/langganan Pub/Sub, dan pengiriman hook OpenClaw. |
| `gmail run`   | Menjalankan `gog watch serve` beserta loop perpanjangan otomatis pemantauan di latar depan. |

<Note>
Gateway juga otomatis memulai `gog gmail watch serve` saat proses dimulai setelah `hooks.enabled=true` dan `hooks.gmail.account` ditetapkan (oleh `gmail setup`). `gmail run` menjalankan logika yang sama di latar depan, yang berguna untuk penelusuran masalah atau ketika pemantau Gateway dinonaktifkan. Lihat [integrasi Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration) untuk detail mulai otomatis dan opsi `OPENCLAW_SKIP_GMAIL_WATCHER` untuk menonaktifkannya.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Menginstal `gcloud` dan `gog` jika belum tersedia, mengautentikasi `gcloud`, membuat topik dan langganan Pub/Sub, memulai pemantauan Gmail, serta menulis konfigurasi `hooks.gmail` dengan `hooks.enabled=true`. Menampilkan `Next: openclaw webhooks gmail run`.

### Wajib

| Flag                | Deskripsi                    |
| ------------------- | ---------------------------- |
| `--account <email>` | Akun Gmail yang akan dipantau. |

### Opsi Pub/Sub

| Flag                    | Bawaan                 | Deskripsi                                                                                                                                                            |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (tidak ada)            | ID proyek GCP (pemilik klien OAuth). Jika tidak tersedia, menggunakan ID proyek milik topik, lalu proyek yang ditentukan dari kredensial `gog`.                      |
| `--topic <name>`        | `gog-gmail-watch`      | Nama topik Pub/Sub.                                                                                                                                                  |
| `--subscription <name>` | `gog-gmail-watch-push` | Nama langganan Pub/Sub.                                                                                                                                              |
| `--label <label>`       | `INBOX`                | Label Gmail yang akan dipantau.                                                                                                                                      |
| `--push-endpoint <url>` | (tidak ada)            | Titik akhir push Pub/Sub eksplisit. Menggantikan Tailscale.                                                                                                         |

### Opsi pengiriman OpenClaw

| Flag                   | Bawaan                                       | Deskripsi                           |
| ---------------------- | -------------------------------------------- | ----------------------------------- |
| `--hook-url <url>`     | Dibuat dari `hooks.path` dan porta Gateway   | URL Webhook OpenClaw.               |
| `--hook-token <token>` | `hooks.token`, atau token yang dibuat        | Token Webhook OpenClaw.             |
| `--push-token <token>` | Token yang dibuat                            | Token push yang diteruskan ke `gog watch serve`. |

### Opsi `gog watch serve`

| Flag                  | Bawaan          | Deskripsi                                                                                                                                                                                  |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | Host pengikatan `gog watch serve`.                                                                                                                                                         |
| `--port <port>`       | `8788`          | Porta `gog watch serve`.                                                                                                                                                                   |
| `--path <path>`       | `/gmail-pubsub` | Jalur `gog watch serve`. Dipaksa menjadi `/` ketika Tailscale diaktifkan tanpa target eksplisit karena Tailscale menghapus jalur tersebut sebelum meneruskannya melalui proksi.              |
| `--include-body`      | `true`          | Menyertakan cuplikan isi surel. Tidak ada flag CLI untuk menonaktifkannya; sebagai gantinya, tetapkan `hooks.gmail.includeBody: false` dalam konfigurasi.                                   |
| `--max-bytes <n>`     | `20000`         | Jumlah maksimum bita per cuplikan isi.                                                                                                                                                     |
| `--renew-minutes <n>` | `720` (12 jam)  | Memperpanjang pemantauan Gmail setiap N menit.                                                                                                                                             |

### Eksposur Tailscale

| Flag                      | Bawaan   | Deskripsi                                                                    |
| ------------------------- | -------- | -------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Mengekspos titik akhir push melalui Tailscale: `funnel`, `serve`, atau `off`. |
| `--tailscale-path <path>` | (tidak ada) | Jalur untuk Tailscale serve/funnel.                                      |
| `--tailscale-target <t>`  | (tidak ada) | Target Tailscale serve/funnel (porta, `host:port`, atau URL).             |

### Keluaran

| Flag     | Deskripsi                                              |
| -------- | ------------------------------------------------------ |
| `--json` | Menampilkan ringkasan yang dapat dibaca mesin, bukan teks. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Menjalankan `gog watch serve` beserta loop perpanjangan otomatis pemantauan di latar depan, dan memulai ulang `gog watch serve` setelah jeda 2 detik jika proses tersebut berhenti secara tidak terduga.

`run` menerima flag Pub/Sub, pengiriman OpenClaw, `gog watch serve`, dan Tailscale yang sama seperti `setup`, kecuali:

- `--account` bersifat **opsional** pada `run`; jika tidak diberikan, nilainya diambil dari `hooks.gmail.account`.
- `run` **tidak** menerima `--project`, `--push-endpoint`, atau `--json`.
- Setiap flag menggunakan nilai konfigurasi `hooks.gmail.*` yang sesuai (ditulis oleh `setup`) jika flag tidak diberikan, kemudian menggunakan nilai bawaan internal yang sama dengan `setup`, dengan satu pengecualian: `--tailscale` menggunakan nilai bawaan `off` pada `run` (bukan `funnel`) ketika flag maupun `hooks.gmail.tailscale.mode` tidak ditetapkan.

| Kategori             | Flag                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub              | `--account`, `--topic`, `--subscription`, `--label`                              |
| Pengiriman OpenClaw  | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`    | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale            | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Untuk `run`, nilai `--topic` adalah jalur lengkap topik Pub/Sub (`projects/.../topics/...`), bukan hanya nama pendek topik.
</Note>

## Terkait

- [Referensi CLI](/id/cli)
- [Otomatisasi Webhook](/id/automation/cron-jobs)
- [Integrasi Gmail Pub/Sub](/id/automation/cron-jobs#gmail-pubsub-integration)
