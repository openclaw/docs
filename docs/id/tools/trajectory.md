---
read_when:
    - Men-debug alasan agen menjawab, gagal, atau memanggil alat dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, panggilan alat, kesalahan runtime, atau metadata penggunaan
    - Menonaktifkan atau memindahkan lokasi perekaman trajektori
summary: Ekspor bundel trajektori yang telah disamarkan untuk mendiagnosis sesi agen OpenClaw
title: Bundel trajektori
x-i18n:
    generated_at: "2026-05-04T09:33:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture adalah perekam perjalanan per sesi OpenClaw. Fitur ini merekam
timeline terstruktur untuk setiap eksekusi agen, lalu `/export-trajectory` mengemas
sesi saat ini menjadi bundle dukungan yang telah disamarkan.

Gunakan saat Anda perlu menjawab pertanyaan seperti:

- Prompt, system prompt, dan alat apa yang dikirim ke model?
- Pesan transkrip dan panggilan alat mana yang menghasilkan jawaban ini?
- Apakah eksekusi mengalami timeout, dibatalkan, mengalami Compaction, atau terkena kesalahan penyedia?
- Model, Plugin, Skills, dan pengaturan runtime mana yang aktif?
- Metadata penggunaan dan prompt-cache apa yang dikembalikan penyedia?

Jika Anda membuat laporan dukungan luas untuk masalah Gateway live, mulai dengan
[`/diagnostics`](/id/gateway/diagnostics#chat-command). Diagnostics mengumpulkan
bundle Gateway yang telah disanitasi dan, untuk sesi harness OpenAI Codex, juga dapat mengirim
umpan balik Codex ke server OpenAI setelah disetujui. Gunakan `/export-trajectory` saat
Anda secara khusus memerlukan timeline prompt, alat, dan transkrip per sesi yang
terperinci.

## Mulai cepat

Kirim ini di sesi aktif:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw menulis bundle di bawah workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Anda dapat memilih nama direktori output relatif:

```text
/export-trajectory bug-1234
```

Path kustom diselesaikan di dalam `.openclaw/trajectory-exports/`. Path absolut
dan path `~` ditolak.

Bundle trajectory dapat berisi prompt, pesan model, skema alat, hasil alat,
peristiwa runtime, dan path lokal. Karena itu, perintah slash chat selalu berjalan
melalui persetujuan exec. Setujui ekspor sekali saat Anda memang ingin
membuat bundle; jangan gunakan allow-all. Di chat grup, OpenClaw mengirim
prompt persetujuan dan hasil ekspor kepada pemilik secara privat, bukan memposting
detail trajectory kembali ke ruang bersama.

Untuk inspeksi lokal atau alur kerja dukungan, Anda juga dapat menjalankan path
perintah yang disetujui secara langsung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Akses

Ekspor trajectory adalah perintah pemilik. Pengirim harus lolos pemeriksaan
otorisasi perintah normal dan pemeriksaan pemilik untuk channel tersebut.

## Apa yang direkam

Trajectory capture aktif secara default untuk eksekusi agen OpenClaw.

Peristiwa runtime mencakup:

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
- panggilan alat
- hasil alat
- compaction
- perubahan model
- label dan entri sesi kustom

Peristiwa ditulis sebagai JSON Lines dengan marker skema ini:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File bundle

Bundle yang diekspor dapat berisi:

| File                  | Isi                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Skema bundle, file sumber, jumlah peristiwa, dan daftar file yang dihasilkan                             |
| `events.jsonl`        | Timeline runtime dan transkrip yang berurutan                                                        |
| `session-branch.json` | Cabang transkrip aktif dan header sesi yang telah disamarkan                                           |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot konfigurasi, Plugin, Skills, dan metadata prompt     |
| `artifacts.json`      | Status akhir, kesalahan, penggunaan, prompt cache, jumlah compaction, teks asisten, dan metadata alat |
| `prompts.json`        | Prompt yang dikirim dan detail pembuatan prompt yang dipilih                                         |
| `system-prompt.txt`   | System prompt terkompilasi terbaru, saat tertangkap                                                   |
| `tools.json`          | Definisi alat yang dikirim ke model, saat tertangkap                                              |

`manifest.json` mencantumkan file yang ada dalam bundle tersebut. Beberapa file dihilangkan
ketika sesi tidak menangkap data runtime yang sesuai.

## Lokasi capture

Secara default, peristiwa trajectory runtime ditulis di samping file sesi:

```text
<session>.trajectory.jsonl
```

OpenClaw juga menulis file pointer best-effort di samping sesi:

```text
<session>.trajectory-path.json
```

Atur `OPENCLAW_TRAJECTORY_DIR` untuk menyimpan sidecar trajectory runtime di
direktori khusus:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Saat variabel ini diatur, OpenClaw menulis satu file JSONL per id sesi di
direktori tersebut.

Pemeliharaan sesi menghapus sidecar trajectory saat entri sesi pemiliknya
dipangkas, dibatasi, atau dikeluarkan oleh anggaran disk sesi. File runtime di luar
direktori sesi hanya dihapus saat target pointer masih membuktikan bahwa file itu
milik sesi tersebut.

## Nonaktifkan capture

Atur `OPENCLAW_TRAJECTORY=0` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan capture trajectory runtime. `/export-trajectory` masih dapat mengekspor
cabang transkrip, tetapi file khusus runtime seperti konteks terkompilasi,
artefak penyedia, dan metadata prompt mungkin tidak ada.

## Privasi dan batasan

Bundle trajectory dirancang untuk dukungan dan debugging, bukan untuk diposting publik.
OpenClaw menyamarkan nilai sensitif sebelum menulis file ekspor:

- kredensial dan field payload yang diketahui menyerupai rahasia
- data gambar
- path status lokal
- path workspace, diganti dengan `$WORKSPACE_DIR`
- path direktori home, jika terdeteksi

Exporter juga membatasi ukuran input:

- file sidecar runtime: capture live berhenti pada 10 MiB dan merekam peristiwa pemotongan saat masih ada ruang; ekspor menerima sidecar runtime yang sudah ada hingga 50 MiB
- file sesi: 50 MiB
- peristiwa runtime: 200.000
- total peristiwa yang diekspor: 250.000
- baris peristiwa runtime individual dipotong di atas 256 KiB

Tinjau bundle sebelum membagikannya di luar tim Anda. Penyamaran bersifat best-effort
dan tidak dapat mengetahui setiap rahasia khusus aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki peristiwa runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- periksa apakah `OPENCLAW_TRAJECTORY_DIR` mengarah ke direktori yang dapat ditulis
- jalankan pesan lain di sesi, lalu ekspor lagi
- inspeksi `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak path output:

- gunakan nama relatif seperti `bug-1234`
- jangan berikan `/tmp/...` atau `~/...`
- pertahankan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal dengan kesalahan ukuran, sesi atau sidecar telah melebihi
batas keamanan ekspor. Mulai sesi baru atau ekspor reproduksi yang lebih kecil.

## Terkait

- [Diff](/id/tools/diffs)
- [Manajemen sesi](/id/concepts/session)
- [Alat exec](/id/tools/exec)
