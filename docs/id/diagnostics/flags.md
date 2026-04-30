---
read_when:
    - Anda memerlukan log awakutu terarah tanpa menaikkan tingkat pencatatan log global
    - Anda perlu mengumpulkan log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug tertarget
title: Opsi diagnostik
x-i18n:
    generated_at: "2026-04-30T09:46:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Flag diagnostik memungkinkan Anda mengaktifkan log debug tertarget tanpa menyalakan logging verbose di semua tempat. Flag bersifat harus diaktifkan secara eksplisit dan tidak berdampak kecuali sebuah subsistem memeriksanya.

## Cara kerjanya

- Flag adalah string (tidak peka huruf besar/kecil).
- Anda dapat mengaktifkan flag dalam konfigurasi atau melalui penimpaan env.
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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Mulai ulang Gateway setelah mengubah flag.

## Penimpaan env (sekali pakai)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Nonaktifkan semua flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefak timeline

Flag `timeline` menulis peristiwa waktu startup dan runtime terstruktur untuk
harness QA eksternal:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Anda juga dapat mengaktifkannya dalam konfigurasi:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Path file timeline tetap berasal dari
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Ketika `timeline` diaktifkan hanya dari
konfigurasi, span pemuatan konfigurasi yang paling awal tidak dikeluarkan karena OpenClaw belum
membaca konfigurasi; span startup berikutnya menggunakan flag konfigurasi.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, dan
`OPENCLAW_DIAGNOSTICS=*` juga mengaktifkan timeline karena semuanya mengaktifkan setiap
flag diagnostik. Gunakan `timeline` ketika Anda hanya menginginkan artefak waktu
JSONL.

Rekaman timeline menggunakan envelope `openclaw.diagnostics.v1`. Peristiwa dapat mencakup
ID proses, nama fase, nama span, durasi, ID Plugin, jumlah dependensi,
sampel penundaan event-loop, nama operasi penyedia, status keluar child process,
serta nama/pesan error startup. Perlakukan file timeline sebagai artefak
diagnostik lokal; tinjau sebelum membagikannya ke luar mesin Anda.

## Lokasi log

Flag mengeluarkan log ke file log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda menetapkan `logging.file`, gunakan path tersebut sebagai gantinya. Log berbentuk JSONL (satu objek JSON per baris). Redaksi tetap diterapkan berdasarkan `logging.redactSensitive`.

## Ekstrak log

Pilih file log terbaru:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter untuk diagnostik HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Atau tail saat mereproduksi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk Gateway jarak jauh, Anda juga dapat menggunakan `openclaw logs --follow` (lihat [/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` ditetapkan lebih tinggi dari `warn`, log ini mungkin disupresi. Default `info` sudah cukup.
- Flag aman dibiarkan aktif; flag hanya memengaruhi volume log untuk subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan, level, dan redaksi log.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
