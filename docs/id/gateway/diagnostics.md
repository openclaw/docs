---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug crash Gateway, restart, tekanan memori, atau payload yang terlalu besar
    - Meninjau data diagnostik apa yang dicatat atau disensor
summary: Buat bundle diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-04-26T11:28:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw dapat membuat zip diagnostik lokal yang aman untuk dilampirkan ke
laporan bug. Ini menggabungkan status Gateway yang telah disanitasi, health, log, bentuk konfigurasi, dan
event stabilitas terbaru tanpa payload.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Perintah ini mencetak path zip yang ditulis. Untuk memilih path:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Untuk otomatisasi:

```bash
openclaw gateway diagnostics export --json
```

## Apa yang terkandung dalam ekspor

Zip mencakup:

- `summary.md`: ringkasan yang dapat dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang dapat dibaca mesin dari konfigurasi, log, status, health,
  dan data stabilitas.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang disanitasi dan detail konfigurasi non-rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang telah disensor.
- Snapshot status dan health Gateway best-effort.
- `stability/latest.json`: bundle stabilitas tersimpan terbaru, jika tersedia.

Ekspor ini berguna bahkan ketika Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau health, log lokal, bentuk konfigurasi, dan bundle
stabilitas terbaru tetap dikumpulkan jika tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor ini mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, ID Plugin, ID provider, ID saluran, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang disensor
- bentuk konfigurasi dan pengaturan fitur non-rahasia

Ekspor ini menghilangkan atau menyensor:

- teks obrolan, prompt, instruksi, body Webhook, dan output tool
- kredensial, API key, token, cookie, dan nilai rahasia
- body permintaan atau respons mentah
- ID akun, ID pesan, ID sesi mentah, hostname, dan nama pengguna lokal

Saat sebuah pesan log terlihat seperti teks payload pengguna, obrolan, prompt, atau tool,
ekspor hanya menyimpan bahwa sebuah pesan dihilangkan dan jumlah byte-nya.

## Perekam stabilitas

Gateway merekam aliran stabilitas terbatas tanpa payload secara default saat
diagnostik diaktifkan. Ini ditujukan untuk fakta operasional, bukan konten.

Periksa perekam langsung:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundle stabilitas tersimpan terbaru setelah keluar fatal, timeout shutdown,
atau kegagalan startup saat restart:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundle tersimpan terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundle tersimpan berada di `~/.openclaw/logs/stability/` saat event tersedia.

## Opsi yang berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: tulis ke path zip tertentu.
- `--log-lines <count>`: jumlah maksimum baris log tersanitasi yang disertakan.
- `--log-bytes <bytes>`: jumlah maksimum byte log yang diperiksa.
- `--url <url>`: URL WebSocket Gateway untuk snapshot status dan health.
- `--token <token>`: token Gateway untuk snapshot status dan health.
- `--password <password>`: password Gateway untuk snapshot status dan health.
- `--timeout <ms>`: timeout snapshot status dan health.
- `--no-stability-bundle`: lewati pencarian bundle stabilitas tersimpan.
- `--json`: cetak metadata ekspor yang dapat dibaca mesin.

## Nonaktifkan diagnostik

Diagnostik diaktifkan secara default. Untuk menonaktifkan perekam stabilitas dan
pengumpulan event diagnostik:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Menonaktifkan diagnostik mengurangi detail laporan bug. Ini tidak memengaruhi
logging Gateway normal.

## Terkait

- [Pemeriksaan health](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#system-and-identity)
- [Logging](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — alur terpisah untuk streaming diagnostik ke kolektor
