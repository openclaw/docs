---
read_when:
    - Men-debug alasan agen menjawab, gagal, atau memanggil alat dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, panggilan tool, kesalahan runtime, atau metadata penggunaan
    - Menonaktifkan atau memindahkan perekaman trajektori
summary: Ekspor bundel trajektori yang telah direduksi untuk men-debug sesi agen OpenClaw
title: Bundel trajektori
x-i18n:
    generated_at: "2026-06-27T18:22:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Penangkapan trajektori adalah perekam perjalanan per sesi OpenClaw. Fitur ini merekam
timeline terstruktur untuk setiap eksekusi agen, lalu `/export-trajectory` mengemas
sesi saat ini menjadi bundel dukungan yang telah disunting.

Gunakan saat Anda perlu menjawab pertanyaan seperti:

- Prompt, prompt sistem, dan alat apa yang dikirim ke model?
- Pesan transkrip dan pemanggilan alat mana yang menghasilkan jawaban ini?
- Apakah eksekusi mengalami waktu habis, dibatalkan, melakukan compact, atau terkena kesalahan provider?
- Model, plugin, skills, dan pengaturan runtime mana yang aktif?
- Metadata penggunaan dan prompt-cache apa yang dikembalikan provider?

Jika Anda membuat laporan dukungan luas untuk masalah Gateway langsung, mulailah dengan
[`/diagnostics`](/id/gateway/diagnostics#chat-command). Diagnostik mengumpulkan bundel
Gateway yang telah disanitasi dan, untuk sesi harness OpenAI Codex, juga dapat mengirim
umpan balik Codex ke server OpenAI setelah disetujui. Gunakan `/export-trajectory` saat
Anda secara khusus memerlukan timeline prompt, alat, dan transkrip per sesi yang terperinci.

## Mulai cepat

Kirim ini di sesi aktif:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw menulis bundel di bawah workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Anda dapat memilih nama direktori keluaran relatif:

```text
/export-trajectory bug-1234
```

Jalur kustom diselesaikan di dalam `.openclaw/trajectory-exports/`. Jalur absolut
dan jalur `~` ditolak.

Bundel trajektori dapat berisi prompt, pesan model, skema alat, hasil alat,
peristiwa runtime, dan jalur lokal. Karena itu, perintah slash chat selalu
melewati persetujuan exec setiap kali. Setujui ekspor satu kali saat Anda memang ingin
membuat bundel; jangan gunakan allow-all. Dalam chat grup, OpenClaw mengirim
prompt persetujuan dan hasil ekspor secara privat kepada pemilik, alih-alih memposting
detail trajektori kembali ke ruang bersama.

Untuk inspeksi lokal atau workflow dukungan, Anda juga dapat menjalankan jalur
perintah yang disetujui secara langsung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Akses

Ekspor trajektori adalah perintah pemilik. Pengirim harus lulus pemeriksaan
otorisasi perintah normal dan pemeriksaan pemilik untuk channel tersebut.

## Yang direkam

Penangkapan trajektori aktif secara default untuk eksekusi agen OpenClaw.

Peristiwa runtime meliputi:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, termasuk model sumber, model berikutnya, alasan/detail kegagalan, posisi rantai, dan apakah fallback maju, berhasil, atau menghabiskan rantai
- `model.completed`
- `trace.artifacts`
- `session.ended`

Peristiwa transkrip juga direkonstruksi dari cabang sesi aktif:

- pesan pengguna
- pesan asisten
- pemanggilan alat
- hasil alat
- compaction
- perubahan model
- label dan entri sesi kustom

Peristiwa ditulis sebagai JSON Lines dengan penanda skema ini:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File bundel

Bundel yang diekspor dapat berisi:

| File                  | Isi                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Skema bundel, file sumber, jumlah peristiwa, dan daftar file yang dibuat                               |
| `events.jsonl`        | Timeline runtime dan transkrip yang berurutan                                                          |
| `session-branch.json` | Cabang transkrip aktif dan header sesi yang telah disunting                                            |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot config, plugin, skills, dan metadata prompt                |
| `artifacts.json`      | Status akhir, kesalahan, penggunaan, cache prompt, jumlah compaction, teks asisten, dan metadata alat  |
| `prompts.json`        | Prompt yang dikirim dan detail pembuatan prompt yang dipilih                                           |
| `system-prompt.txt`   | Prompt sistem terkompilasi terbaru, saat tertangkap                                                    |
| `tools.json`          | Definisi alat yang dikirim ke model, saat tertangkap                                                   |

`manifest.json` mencantumkan file yang ada di bundel tersebut. Beberapa file dihilangkan
ketika sesi tidak menangkap data runtime yang sesuai.

## Lokasi penangkapan

Secara default, peristiwa trajektori runtime ditulis di samping file sesi:

```text
<session>.trajectory.jsonl
```

OpenClaw juga menulis file penunjuk best-effort di samping sesi:

```text
<session>.trajectory-path.json
```

Setel `OPENCLAW_TRAJECTORY_DIR` untuk menyimpan sidecar trajektori runtime di
direktori khusus:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Saat variabel ini disetel, OpenClaw menulis satu file JSONL per id sesi di
direktori tersebut.

Pemeliharaan sesi menghapus sidecar trajektori saat entri sesi pemiliknya
dipangkas, dibatasi, atau dikeluarkan oleh anggaran disk sesi. File runtime di luar
direktori sesi hanya dihapus ketika target penunjuk masih membuktikan bahwa file itu
milik sesi tersebut.

## Nonaktifkan penangkapan

Setel `OPENCLAW_TRAJECTORY=0` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan penangkapan trajektori runtime. `/export-trajectory` masih dapat mengekspor
cabang transkrip, tetapi file khusus runtime seperti konteks terkompilasi,
artefak provider, dan metadata prompt mungkin tidak ada.

## Sesuaikan waktu habis flush

OpenClaw melakukan flush sidecar trajektori runtime selama pembersihan agen. Waktu habis
pembersihan default adalah 10.000 ms. Pada disk lambat atau penyimpanan besar, setel
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Ini mengontrol kapan OpenClaw mencatat waktu habis `openclaw-trajectory-flush` dan melanjutkan.
Ini tidak mengubah batas ukuran trajektori. Untuk menyesuaikan semua langkah pembersihan agen
yang tidak meneruskan waktu habis eksplisit, setel `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privasi dan batas

Bundel trajektori dirancang untuk dukungan dan debugging, bukan untuk diposting secara publik.
OpenClaw menyunting nilai sensitif sebelum menulis file ekspor:

- kredensial dan field payload yang diketahui tampak seperti rahasia
- data gambar
- jalur state lokal
- jalur workspace, diganti dengan `$WORKSPACE_DIR`
- jalur direktori home, jika terdeteksi

Eksportir juga membatasi ukuran input:

- file sidecar runtime: penangkapan live berhenti pada 10 MiB dan merekam peristiwa pemotongan saat masih ada ruang; ekspor menerima sidecar runtime yang sudah ada hingga 50 MiB
- file sesi: 50 MiB
- peristiwa runtime: 200.000
- total peristiwa yang diekspor: 250.000
- baris peristiwa runtime individual dipotong di atas 256 KiB

Tinjau bundel sebelum membagikannya di luar tim Anda. Penyuntingan bersifat best-effort
dan tidak dapat mengetahui setiap rahasia khusus aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki peristiwa runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- periksa apakah `OPENCLAW_TRAJECTORY_DIR` menunjuk ke direktori yang dapat ditulis
- jalankan pesan lain dalam sesi, lalu ekspor lagi
- periksa `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak jalur keluaran:

- gunakan nama relatif seperti `bug-1234`
- jangan meneruskan `/tmp/...` atau `~/...`
- pertahankan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal dengan kesalahan ukuran, sesi atau sidecar melampaui
batas keamanan ekspor. Mulai sesi baru atau ekspor reproduksi yang lebih kecil.

## Terkait

- [Diff](/id/tools/diffs)
- [Manajemen sesi](/id/concepts/session)
- [Alat exec](/id/tools/exec)
