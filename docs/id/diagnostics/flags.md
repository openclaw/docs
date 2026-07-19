---
read_when:
    - Anda memerlukan log debug yang ditargetkan tanpa menaikkan level logging global
    - Anda perlu mengambil log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug yang ditargetkan
title: Flag diagnostik
x-i18n:
    generated_at: "2026-07-19T05:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a54692af361edcdc82863fb9c742a9dde21ed242f38e4253b6e27edb6a74f21
    source_path: diagnostics/flags.md
    workflow: 16
---

Flag diagnostik mengaktifkan pencatatan log tambahan untuk satu subsistem tanpa menaikkan
`logging.level` secara global. Sebuah flag tidak berpengaruh kecuali jika diperiksa oleh subsistem.

## Cara kerjanya

- Flag adalah string yang tidak peka huruf besar-kecil, diambil dari `diagnostics.flags` dalam
  konfigurasi serta penimpaan env `OPENCLAW_DIAGNOSTICS`, lalu dideduplikasi dan diubah menjadi huruf kecil.
- `name.*` cocok dengan `name` itu sendiri dan semua yang berada di bawah `name.` (misalnya,
  `telegram.*` cocok dengan `telegram.http`).
- `*` atau `all` mengaktifkan setiap flag.
- Mulai ulang Gateway setelah mengubah `diagnostics.flags` dalam konfigurasi; perubahan tersebut tidak
  dimuat ulang secara langsung.

## Flag yang diketahui

| Flag                  | Mengaktifkan                                              |
| --------------------- | --------------------------------------------------------- |
| `telegram.http`       | Pencatatan log kesalahan HTTP Telegram Bot API            |
| `brave.http`          | Pencatatan log permintaan/respons/cache Brave Search      |
| `profiler`            | Profiler tahap balasan dan profiler server aplikasi Codex (keduanya) |
| `reply.profiler`      | Hanya profiler tahap balasan                              |
| `codex.profiler`      | Hanya profiler server aplikasi Codex                      |
| `health`              | Detail debug pemeriksaan kesehatan/akun/pengikatan Gateway |
| `ingress.timing`      | Pengaturan waktu pemuatan sesi, pemilihan model, dan katalog model |
| `plugin.load-profile` | Pengaturan waktu pemuatan modul plugin secara sinkron     |
| `timeline`            | Artefak lini masa JSONL terstruktur (lihat di bawah)      |

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

## Penimpaan env (sekali pakai)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Nilai dipisahkan berdasarkan koma atau spasi. Nilai khusus:

| Nilai                       | Efek                                     |
| --------------------------- | ---------------------------------------- |
| `0`, `false`, `off`, `none` | Menonaktifkan semua flag, termasuk menimpa konfigurasi |
| `1`, `true`, `all`, `*`     | Mengaktifkan setiap flag                 |

`OPENCLAW_DIAGNOSTICS=0` menonaktifkan flag dari env dan konfigurasi untuk
proses tersebut, yang berguna untuk membisukan sementara flag profiler yang dibiarkan aktif dalam konfigurasi
tanpa mengedit berkas.

## Flag profiler

Flag profiler mengendalikan rentang pengaturan waktu ringan; tidak menambah beban saat dinonaktifkan.

Aktifkan semua rentang yang dikendalikan profiler untuk satu kali proses Gateway:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Aktifkan hanya rentang profiler pengiriman balasan:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Aktifkan hanya rentang profiler startup/alat/utas server aplikasi Codex:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` mengaktifkan profiler balasan dan profiler Codex; gunakan
nama flag tercakup untuk mengaktifkan hanya salah satunya.

Atau tetapkan dalam konfigurasi:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Mulai ulang Gateway setelah mengubah flag konfigurasi. Untuk menonaktifkan flag profiler,
hapus flag tersebut dari `diagnostics.flags` dan mulai ulang, atau mulai proses dengan
`OPENCLAW_DIAGNOSTICS=0` untuk menimpa setiap flag diagnostik bagi proses tersebut.

## Artefak lini masa

Flag `timeline` (alias: `diagnostics.timeline`) menulis peristiwa pengaturan waktu startup
dan runtime terstruktur sebagai JSONL, untuk harness QA eksternal:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Atau aktifkan dalam konfigurasi:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Jalur keluaran selalu berasal dari `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, bahkan
saat flag itu sendiri ditetapkan dalam konfigurasi; tidak ada kunci konfigurasi untuk jalur tersebut.
Saat `timeline` hanya diaktifkan dari konfigurasi, rentang pemuatan konfigurasi paling awal
tidak tersedia karena OpenClaw belum membaca konfigurasi; rentang startup berikutnya
direkam secara normal.

`OPENCLAW_DIAGNOSTICS=1`, `=all`, dan `=*` juga mengaktifkan lini masa, karena ketiganya
mengaktifkan setiap flag. Utamakan flag tercakup `timeline` jika Anda hanya menginginkan
artefak JSONL dan bukan semua flag diagnostik lainnya.

Sampel penundaan loop peristiwa dalam lini masa memerlukan satu persetujuan tambahan selain
`timeline`: tetapkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (atau `on`/`true`/`yes`) selain
mengaktifkan lini masa.

Rekaman lini masa menggunakan amplop `openclaw.diagnostics.v1` dan dapat mencakup
ID proses, nama fase, nama rentang, durasi, ID plugin, jumlah dependensi,
sampel penundaan loop peristiwa, nama operasi penyedia, status keluar proses anak,
serta nama/pesan kesalahan startup. Perlakukan berkas lini masa sebagai artefak
diagnostik lokal; tinjau sebelum membagikannya ke luar mesin Anda.

## Lokasi log

Flag mengirimkan log ke berkas log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda menetapkan `logging.file`, gunakan jalur tersebut sebagai gantinya. Log berformat JSONL (satu objek JSON
per baris). Redaksi tetap diterapkan berdasarkan `logging.redactSensitive`.
Lihat [Pencatatan log](/id/logging) untuk resolusi jalur log, rotasi, dan
model redaksi selengkapnya.

## Ekstrak log

Pilih berkas log terbaru:

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

Atau pantau saat mereproduksi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk Gateway jarak jauh, gunakan `openclaw logs --follow` sebagai gantinya (lihat
[/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` ditetapkan lebih tinggi daripada `warn`, log yang dikendalikan flag mungkin
  disembunyikan. Nilai default `info` sudah sesuai.
- `brave.http` mencatat URL/parameter kueri permintaan Brave Search, status/pengaturan waktu
  respons, serta peristiwa hit/miss/penulisan cache. Flag ini tidak mencatat kunci API
  (yang dikirim sebagai header permintaan) atau isi respons, tetapi kueri pencarian dapat bersifat
  sensitif.
- Flag aman dibiarkan aktif; flag tersebut hanya memengaruhi volume log untuk
  subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan, tingkat, dan redaksi log.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
