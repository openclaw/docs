---
read_when:
    - Anda memerlukan log debug tertarget tanpa menaikkan tingkat pencatatan log global
    - Anda perlu mengumpulkan log khusus subsistem untuk keperluan dukungan
summary: Flag diagnostik untuk log debug tertarget
title: Flag diagnostik
x-i18n:
    generated_at: "2026-05-02T09:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Flag diagnostik memungkinkan Anda mengaktifkan log debug yang ditargetkan tanpa menyalakan logging verbose di semua tempat. Flag bersifat opt-in dan tidak berpengaruh kecuali suatu subsistem memeriksanya.

## Cara kerjanya

- Flag adalah string (tidak peka huruf besar/kecil).
- Anda dapat mengaktifkan flag di konfigurasi atau melalui override env.
- Wildcard didukung:
  - `telegram.*` cocok dengan `telegram.http`
  - `*` mengaktifkan semua flag

## Aktifkan melalui konfigurasi

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Beberapa flag:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

Mulai ulang gateway setelah mengubah flag.

## Override env (sekali pakai)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Nonaktifkan semua flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefak linimasa

Flag `timeline` menulis peristiwa waktu startup dan runtime terstruktur untuk
harness QA eksternal:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Anda juga dapat mengaktifkannya di konfigurasi:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Jalur file linimasa tetap berasal dari
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Ketika `timeline` hanya diaktifkan dari
konfigurasi, span pemuatan konfigurasi paling awal tidak dipancarkan karena OpenClaw
belum membaca konfigurasi; span startup berikutnya menggunakan flag konfigurasi.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, dan
`OPENCLAW_DIAGNOSTICS=*` juga mengaktifkan linimasa karena semuanya mengaktifkan setiap
flag diagnostik. Pilih `timeline` jika Anda hanya menginginkan artefak waktu
JSONL.

Catatan linimasa menggunakan envelope `openclaw.diagnostics.v1`. Peristiwa dapat menyertakan
ID proses, nama fase, nama span, durasi, ID Plugin, jumlah dependensi,
sampel penundaan event-loop, nama operasi penyedia, status keluar proses anak,
dan nama/pesan kesalahan startup. Perlakukan file linimasa sebagai artefak diagnostik
lokal; tinjau sebelum membagikannya ke luar mesin Anda.

## Lokasi log

Flag memancarkan log ke file log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda mengatur `logging.file`, gunakan jalur tersebut sebagai gantinya. Log adalah JSONL (satu objek JSON per baris). Redaksi tetap diterapkan berdasarkan `logging.redactSensitive`.

## Ekstrak log

Pilih file log terbaru:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter untuk diagnostik HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filter untuk diagnostik HTTP Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Atau tail saat mereproduksi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk Gateway jarak jauh, Anda juga dapat menggunakan `openclaw logs --follow` (lihat [/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` diatur lebih tinggi dari `warn`, log ini mungkin ditekan. Default `info` sudah memadai.
- `brave.http` mencatat URL/parameter kueri permintaan Brave Search, status/waktu respons, dan peristiwa cache hit/miss/write. Ini tidak mencatat kunci API atau isi respons, tetapi kueri pencarian dapat bersifat sensitif.
- Flag aman dibiarkan aktif; flag hanya memengaruhi volume log untuk subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan, level, dan redaksi log.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
