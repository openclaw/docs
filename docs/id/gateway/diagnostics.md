---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug crash, restart, tekanan memori, atau payload yang terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang dicatat atau disamarkan
summary: Buat bundle diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-04-24T09:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3773b623a3f94a1f1340f2d278d9f5236f18fbf9aa38f84ec9ddbe41aea44e8c
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw dapat membuat zip diagnostik lokal yang aman untuk dilampirkan ke
laporan bug. Zip ini menggabungkan status Gateway yang disanitasi, health, log, bentuk config, dan
peristiwa stability terbaru tanpa payload.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Perintah ini mencetak path zip yang ditulis. Untuk memilih path:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Untuk otomasi:

```bash
openclaw gateway diagnostics export --json
```

## Apa yang dikandung ekspor

Zip ini menyertakan:

- `summary.md`: ikhtisar yang dapat dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang dapat dibaca mesin tentang config, log, status, health,
  dan data stability.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk config yang disanitasi dan detail config non-secret.
- Ringkasan log yang disanitasi dan baris log yang disamarkan terbaru.
- Snapshot status dan health Gateway dengan best-effort.
- `stability/latest.json`: bundle stability persisten terbaru, jika tersedia.

Ekspor ini tetap berguna bahkan ketika Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau health, log lokal, bentuk config, dan bundle
stability terbaru tetap dikumpulkan bila tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor ini menyimpan data operasional
yang membantu debugging, seperti:

- nama subsistem, id plugin, id provider, id channel, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang disamarkan
- bentuk config dan pengaturan fitur non-secret

Ekspor ini menghilangkan atau menyamarkan:

- teks chat, prompt, instruksi, body webhook, dan output alat
- kredensial, API key, token, cookie, dan nilai secret
- body permintaan atau respons mentah
- id akun, id pesan, id sesi mentah, hostname, dan nama pengguna lokal

Saat sebuah pesan log tampak seperti teks payload pengguna, chat, prompt, atau alat, ekspor
hanya menyimpan bahwa sebuah pesan dihilangkan dan jumlah bytenya.

## Perekam stability

Gateway mencatat stream stability terbatas tanpa payload secara default saat
diagnostik diaktifkan. Perekam ini untuk fakta operasional, bukan konten.

Periksa perekam live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundle stability persisten terbaru setelah keluar fatal, timeout shutdown,
atau kegagalan startup saat restart:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundle persisten terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundle persisten berada di bawah `~/.openclaw/logs/stability/` saat ada peristiwa.

## Opsi yang berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: tulis ke path zip tertentu.
- `--log-lines <count>`: jumlah maksimum baris log yang disanitasi untuk disertakan.
- `--log-bytes <bytes>`: jumlah maksimum byte log untuk diperiksa.
- `--url <url>`: URL WebSocket Gateway untuk snapshot status dan health.
- `--token <token>`: token Gateway untuk snapshot status dan health.
- `--password <password>`: kata sandi Gateway untuk snapshot status dan health.
- `--timeout <ms>`: batas waktu snapshot status dan health.
- `--no-stability-bundle`: lewati lookup bundle stability persisten.
- `--json`: cetak metadata ekspor yang dapat dibaca mesin.

## Nonaktifkan diagnostik

Diagnostik diaktifkan secara default. Untuk menonaktifkan perekam stability dan
pengumpulan peristiwa diagnostik:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Menonaktifkan diagnostik mengurangi detail laporan bug. Ini tidak memengaruhi
pencatatan log Gateway normal.

## Dokumen terkait

- [Pemeriksaan Health](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#system-and-identity)
- [Logging](/id/logging)
