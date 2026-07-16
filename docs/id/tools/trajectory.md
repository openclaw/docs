---
read_when:
    - Men-debug alasan agen menjawab, gagal, atau memanggil alat dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, pemanggilan alat, kesalahan runtime, atau metadata penggunaan
    - Menonaktifkan perekaman lintasan
summary: Ekspor bundel lintasan yang telah disunting untuk men-debug sesi agen OpenClaw
title: Bundel lintasan
x-i18n:
    generated_at: "2026-07-16T18:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

Perekaman trajektori adalah perekam penerbangan per sesi milik OpenClaw. Fitur ini merekam
linimasa terstruktur untuk setiap proses agen, lalu `/export-trajectory` mengemas
sesi saat ini menjadi bundel dukungan yang telah disunting, yang mencakup:

- Prompt, prompt sistem, dan alat yang dikirim ke model
- Pesan transkrip dan panggilan alat yang menghasilkan jawaban
- Apakah proses mengalami batas waktu, dibatalkan, mengalami Compaction, atau menemui kesalahan penyedia
- Model, plugin, Skills, dan pengaturan runtime yang aktif
- Metadata penggunaan dan cache prompt yang dikembalikan penyedia

Untuk laporan dukungan Gateway yang luas, mulailah dengan
[`/diagnostics`](/id/gateway/diagnostics#chat-command); perintah ini mengumpulkan
bundel Gateway yang telah disanitasi dan, untuk sesi harness OpenAI Codex, dapat mengirim umpan balik
Codex ke OpenAI setelah disetujui. Gunakan `/export-trajectory` saat memerlukan
linimasa terperinci per sesi untuk prompt, alat, dan transkrip.

## Mulai cepat

Kirim dalam sesi aktif (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw menulis bundel di bawah ruang kerja:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Berikan nama direktori keluaran relatif untuk menggantinya:

```text
/export-trajectory bug-1234
```

Nama tersebut diuraikan di dalam `.openclaw/trajectory-exports/`. Jalur absolut dan
jalur `~` ditolak.

Bundel trajektori dapat berisi prompt, pesan model, skema alat, hasil alat,
peristiwa runtime, dan jalur lokal, sehingga perintah chat selalu dijalankan
melalui persetujuan eksekusi. Setujui ekspor satu kali saat Anda memang bermaksud membuat
bundel tersebut; jangan gunakan izinkan-semua. Dalam chat grup, OpenClaw mengirimkan
prompt persetujuan dan hasil ekspor secara privat kepada pemilik, alih-alih memposting detail
trajektori kembali ke ruang bersama.

Untuk pemeriksaan lokal atau alur kerja dukungan, jalankan perintah CLI yang mendasarinya
secara langsung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Flag lainnya: `--output <path>` (nama direktori di dalam
`.openclaw/trajectory-exports`), `--store <path>` (penggantian penyimpanan sesi),
`--agent <id>` (ID agen untuk resolusi penyimpanan), `--json` (keluaran terstruktur).

## Akses

Ekspor trajektori adalah perintah pemilik. Pengirim harus lulus pemeriksaan
otorisasi perintah normal serta pemeriksaan pemilik untuk kanal tersebut.

## Yang direkam

Perekaman trajektori aktif secara default untuk proses agen OpenClaw.

Peristiwa runtime mencakup:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, termasuk model sumber, model berikutnya, alasan/detail kegagalan, posisi rantai, serta apakah rantai berlanjut, berhasil, atau telah habis
- `model.completed`
- `trace.artifacts`
- `session.ended`

Peristiwa transkrip direkonstruksi dari cabang sesi aktif: pesan pengguna,
pesan asisten, panggilan alat, hasil alat, Compaction, perubahan model,
label, dan entri sesi khusus.

Peristiwa ditulis sebagai JSON Lines dengan penanda skema ini:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File bundel

| File                  | Isi                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Skema bundel, file sumber, jumlah peristiwa, dan daftar file yang dihasilkan                             |
| `events.jsonl`        | Linimasa runtime dan transkrip yang berurutan                                                        |
| `session-branch.json` | Cabang transkrip aktif dan header sesi yang telah disunting                                           |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot konfigurasi, plugin, Skills, dan metadata prompt     |
| `artifacts.json`      | Status akhir, kesalahan, penggunaan, cache prompt, jumlah Compaction, teks asisten, dan metadata alat |
| `prompts.json`        | Prompt yang dikirimkan dan detail pembuatan prompt yang dipilih                                         |
| `system-prompt.txt`   | Prompt sistem terkompilasi terbaru, jika direkam                                                   |
| `tools.json`          | Definisi alat yang dikirim ke model, jika direkam                                              |

`manifest.json` mencantumkan file yang ada dalam bundel tertentu; beberapa file
dihilangkan jika sesi tidak merekam data runtime yang sesuai.

## Penyimpanan rekaman

Peristiwa trajektori runtime disimpan bersama sesi dalam basis data SQLite
per agen. Mengekspor trajektori menghasilkan bundel dukungan JSONL yang telah disunting;
rekaman runtime aktif bukan file pendamping JSONL di samping sesi.

File `.trajectory.jsonl` dan `.trajectory-path.json` lama mungkin masih muncul
dari rilis terdahulu atau ekspor file lama yang eksplisit. Pemeliharaan sesi memperlakukan
file tersebut sebagai target pembersihan; perekaman aktif menulis baris basis data.

## Menonaktifkan perekaman

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan perekaman trajektori runtime sebelum memulai OpenClaw.
`/export-trajectory` masih dapat mengekspor cabang transkrip, tetapi data khusus
runtime seperti konteks terkompilasi, artefak penyedia, dan metadata prompt mungkin
tidak tersedia.

## Menyesuaikan batas waktu flush

OpenClaw melakukan flush baris trajektori runtime selama pembersihan agen. Batas waktu
pembersihan default adalah 10,000 ms. Pada disk lambat atau penyimpanan besar, tetapkan
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Ini mengontrol kapan OpenClaw mencatat batas waktu `openclaw-trajectory-flush` dan
melanjutkan; pengaturan ini tidak mengubah batas ukuran trajektori. Untuk menyesuaikan semua langkah
pembersihan agen yang tidak memberikan batas waktu eksplisit, tetapkan
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privasi dan batas

Bundel trajektori ditujukan untuk dukungan dan debugging, bukan untuk diposting secara publik. OpenClaw
menyunting nilai sensitif sebelum menulis file ekspor:

- kredensial dan bidang payload yang diketahui menyerupai rahasia
- data gambar
- jalur status lokal
- jalur ruang kerja, diganti dengan `$WORKSPACE_DIR`
- jalur direktori home, jika terdeteksi

Pengekspor juga membatasi ukuran masukan:

- perekaman runtime: rekaman aktif adalah jendela bergulir yang dibatasi hingga 10 MiB, dengan menghapus peristiwa terlama untuk memberi ruang bagi peristiwa baru; ekspor menerima file pendamping runtime lama yang sudah ada hingga 50 MiB
- file sesi: 50 MiB
- peristiwa runtime per ekspor: 200,000
- total peristiwa yang diekspor: 250,000
- baris peristiwa runtime individual dipotong jika melebihi 256 KiB

Tinjau bundel sebelum membagikannya ke luar tim Anda. Penyuntingan dilakukan dengan upaya terbaik
dan tidak dapat mengetahui setiap rahasia khusus aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki peristiwa runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- jalankan pesan lain dalam sesi, lalu ekspor kembali
- periksa `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak jalur keluaran:

- gunakan nama relatif seperti `bug-1234`
- jangan berikan `/tmp/...` atau `~/...`
- pertahankan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal karena kesalahan ukuran, sesi atau file pendamping melampaui
batas keamanan ekspor di atas. Mulai sesi baru atau ekspor reproduksi yang
lebih kecil.

## Terkait

- [Perbedaan](/id/tools/diffs)
- [Pengelolaan sesi](/id/concepts/session)
- [Alat eksekusi](/id/tools/exec)
