---
read_when:
    - Anda memerlukan log debug yang ditargetkan tanpa menaikkan tingkat logging global
    - Anda perlu mengumpulkan log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug yang ditargetkan
title: Flag diagnostik
x-i18n:
    generated_at: "2026-07-12T14:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Flag diagnostik mengaktifkan pencatatan log tambahan untuk satu subsistem tanpa menaikkan
`logging.level` secara global. Sebuah flag tidak berpengaruh kecuali diperiksa oleh subsistem.

## Cara kerjanya

- Flag adalah string yang tidak peka huruf besar-kecil, ditentukan dari `diagnostics.flags` dalam
  konfigurasi ditambah penimpaan env `OPENCLAW_DIAGNOSTICS`, lalu duplikatnya dihapus dan diubah menjadi huruf kecil.
- `name.*` cocok dengan `name` itu sendiri dan apa pun di bawah `name.` (misalnya
  `telegram.*` cocok dengan `telegram.http`).
- `*` atau `all` mengaktifkan setiap flag.
- Mulai ulang Gateway setelah mengubah `diagnostics.flags` dalam konfigurasi; perubahan ini tidak
  dimuat ulang secara langsung.

## Flag yang diketahui

| Flag             | Mengaktifkan                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `telegram.http`  | Pencatatan log galat HTTP Telegram Bot API                          |
| `brave.http`     | Pencatatan log permintaan/respons/cache Brave Search                |
| `profiler`       | Profiler tahap balasan dan profiler server aplikasi Codex (keduanya) |
| `reply.profiler` | Hanya profiler tahap balasan                                        |
| `codex.profiler` | Hanya profiler server aplikasi Codex                                |
| `timeline`       | Artefak linimasa JSONL terstruktur (lihat di bawah)                 |

## Mengaktifkan melalui konfigurasi

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

| Nilai                       | Efek                                                  |
| --------------------------- | ----------------------------------------------------- |
| `0`, `false`, `off`, `none` | Menonaktifkan semua flag, juga menimpa konfigurasi    |
| `1`, `true`, `all`, `*`     | Mengaktifkan setiap flag                              |

`OPENCLAW_DIAGNOSTICS=0` menonaktifkan flag dari env dan konfigurasi untuk
proses tersebut, yang berguna untuk membisukan sementara flag profiler yang dibiarkan aktif dalam konfigurasi
tanpa mengedit berkas.

## Flag profiler

Flag profiler mengendalikan rentang pengukuran waktu ringan; flag ini tidak menambah beban saat dinonaktifkan.

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
nama flag dengan cakupan tertentu untuk mengaktifkan hanya salah satunya.

Atau tetapkan dalam konfigurasi:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Mulai ulang Gateway setelah mengubah flag konfigurasi. Untuk menonaktifkan flag profiler,
hapus flag tersebut dari `diagnostics.flags` dan mulai ulang, atau jalankan proses dengan
`OPENCLAW_DIAGNOSTICS=0` untuk menimpa setiap flag diagnostik selama proses tersebut.

## Artefak linimasa

Flag `timeline` (alias: `diagnostics.timeline`) menulis peristiwa pengukuran waktu startup
dan waktu proses secara terstruktur sebagai JSONL, untuk perangkat pengujian QA eksternal:

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
ketika flag itu sendiri ditetapkan dalam konfigurasi; tidak ada kunci konfigurasi untuk jalur tersebut.
Ketika `timeline` hanya diaktifkan dari konfigurasi, rentang pemuatan konfigurasi paling awal
tidak tersedia karena OpenClaw belum membaca konfigurasi; rentang startup berikutnya
direkam secara normal.

`OPENCLAW_DIAGNOSTICS=1`, `=all`, dan `=*` juga mengaktifkan linimasa, karena semuanya
mengaktifkan setiap flag. Pilih flag `timeline` dengan cakupan tertentu jika Anda hanya menginginkan
artefak JSONL dan bukan semua flag diagnostik lainnya.

Sampel penundaan loop peristiwa dalam linimasa memerlukan satu persetujuan tambahan selain
`timeline`: tetapkan `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (atau `on`/`true`/`yes`) selain
mengaktifkan linimasa.

Catatan linimasa menggunakan envelope `openclaw.diagnostics.v1` dan dapat menyertakan
ID proses, nama fase, nama rentang, durasi, ID Plugin, jumlah dependensi,
sampel penundaan loop peristiwa, nama operasi penyedia, status keluar proses turunan,
serta nama/pesan galat startup. Perlakukan berkas linimasa sebagai artefak
diagnostik lokal; tinjau sebelum membagikannya ke luar mesin Anda.

## Lokasi log

Flag menghasilkan log ke dalam berkas log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda menetapkan `logging.file`, gunakan jalur tersebut sebagai gantinya. Log berformat JSONL (satu objek JSON
per baris). Penyuntingan informasi sensitif tetap diterapkan berdasarkan `logging.redactSensitive`.
Lihat [Pencatatan log](/id/logging) untuk model lengkap penentuan jalur log, rotasi, dan
penyuntingan informasi sensitif.

## Mengekstrak log

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

Atau pantau saat mereproduksi masalah:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk Gateway jarak jauh, gunakan `openclaw logs --follow` sebagai gantinya (lihat
[/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` ditetapkan lebih tinggi daripada `warn`, log yang dikendalikan flag mungkin
  tidak dicatat. Nilai default `info` sudah sesuai.
- `brave.http` mencatat URL/parameter kueri permintaan Brave Search, status/waktu
  respons, serta peristiwa cache ditemukan/tidak ditemukan/ditulis. Flag ini tidak mencatat kunci API
  (dikirim sebagai header permintaan) atau isi respons, tetapi kueri pencarian dapat bersifat
  sensitif.
- Flag aman dibiarkan aktif; flag hanya memengaruhi volume log untuk
  subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan, tingkat, dan penyuntingan informasi sensitif log.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
