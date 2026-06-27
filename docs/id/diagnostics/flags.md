---
read_when:
    - Anda memerlukan log debug yang terarah tanpa menaikkan tingkat logging global
    - Anda perlu menangkap log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug tertarget
title: Flag diagnostik
x-i18n:
    generated_at: "2026-06-27T17:27:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Flag diagnostik memungkinkan Anda mengaktifkan log debug yang ditargetkan tanpa menyalakan logging verbose di semua tempat. Flag bersifat opt-in dan tidak berpengaruh kecuali suatu subsistem memeriksanya.

## Cara kerjanya

- Flag adalah string (tidak peka huruf besar/kecil).
- Anda dapat mengaktifkan flag di config atau melalui override env.
- Wildcard didukung:
  - `telegram.*` cocok dengan `telegram.http`
  - `*` mengaktifkan semua flag

## Aktifkan melalui config

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

Mulai ulang Gateway setelah mengubah flag.

## Override env (sekali pakai)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Nonaktifkan semua flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` adalah override penonaktifan tingkat proses: ini menonaktifkan
flag dari env maupun config untuk proses tersebut.

## Flag profiling

Flag profiler mengaktifkan span timing yang ditargetkan tanpa menaikkan level
logging global. Flag ini dinonaktifkan secara default.

Aktifkan semua span yang digating profiler untuk satu kali jalan Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Aktifkan hanya span profiler reply-dispatch:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Aktifkan hanya span profiler startup/tool/thread server aplikasi Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Aktifkan flag profiler dari config:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Mulai ulang Gateway setelah mengubah flag config. Untuk menonaktifkan flag profiler,
hapus dari `diagnostics.flags` dan mulai ulang. Untuk menonaktifkan sementara semua
flag diagnostik meskipun config mengaktifkan flag profiler, mulai proses dengan:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefak timeline

Flag `timeline` menulis event timing startup dan runtime terstruktur untuk
harness QA eksternal:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Anda juga dapat mengaktifkannya di config:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Path file timeline tetap berasal dari
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Saat `timeline` diaktifkan hanya dari
config, span pemuatan config paling awal tidak dipancarkan karena OpenClaw belum
membaca config; span startup berikutnya menggunakan flag config.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, dan
`OPENCLAW_DIAGNOSTICS=*` juga mengaktifkan timeline karena semuanya mengaktifkan setiap
flag diagnostik. Pilih `timeline` ketika Anda hanya menginginkan artefak timing
JSONL.

Record timeline menggunakan envelope `openclaw.diagnostics.v1`. Event dapat menyertakan
id proses, nama fase, nama span, durasi, id plugin, jumlah dependensi,
sampel delay event-loop, nama operasi provider, status keluar child-process,
dan nama/pesan error startup. Perlakukan file timeline sebagai artefak diagnostik
lokal; tinjau sebelum membagikannya ke luar mesin Anda.

## Ke mana log ditulis

Flag memancarkan log ke file log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda menetapkan `logging.file`, gunakan path tersebut sebagai gantinya. Log berbentuk JSONL (satu objek JSON per baris). Redaksi tetap diterapkan berdasarkan `logging.redactSensitive`.

## Ekstrak log

Pilih file log terbaru:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter diagnostik HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filter diagnostik HTTP Brave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Atau tail saat mereproduksi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk Gateway jarak jauh, Anda juga dapat menggunakan `openclaw logs --follow` (lihat [/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` disetel lebih tinggi daripada `warn`, log ini mungkin ditekan. Default `info` sudah cukup.
- `brave.http` mencatat URL/parameter query request Brave Search, status/timing respons, dan event cache hit/miss/write. Ini tidak mencatat API key atau body respons, tetapi query pencarian dapat bersifat sensitif.
- Flag aman dibiarkan aktif; flag hanya memengaruhi volume log untuk subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan log, level, dan redaksi.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
