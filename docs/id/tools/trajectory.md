---
read_when:
    - Men-debug mengapa agen menjawab, gagal, atau memanggil tool dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, panggilan tool, error runtime, atau metadata penggunaan
    - Menonaktifkan atau memindahkan pengambilan trajectory
summary: Ekspor bundel trajectory yang telah disunting untuk men-debug sesi agen OpenClaw
title: Bundel trajectory
x-i18n:
    generated_at: "2026-04-24T09:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

Pengambilan trajectory adalah flight recorder per sesi milik OpenClaw. Fitur ini merekam
linimasa terstruktur untuk setiap run agen, lalu `/export-trajectory` mengemas
sesi saat ini menjadi bundel dukungan yang telah disunting.

Gunakan fitur ini ketika Anda perlu menjawab pertanyaan seperti:

- Prompt, system prompt, dan tool apa yang dikirim ke model?
- Pesan transkrip dan panggilan tool mana yang mengarah ke jawaban ini?
- Apakah run mengalami time out, abort, compaction, atau error provider?
- Model, plugin, skill, dan pengaturan runtime apa yang aktif?
- Metadata usage dan prompt-cache apa yang dikembalikan provider?

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

Anda dapat memilih nama direktori output relatif:

```text
/export-trajectory bug-1234
```

Path kustom tersebut diselesaikan di dalam `.openclaw/trajectory-exports/`. Path absolut
dan path `~` ditolak.

## Akses

Ekspor trajectory adalah perintah owner. Pengirim harus lolos pemeriksaan
otorisasi perintah normal dan pemeriksaan owner untuk kanal tersebut.

## Apa yang direkam

Pengambilan trajectory aktif secara default untuk run agen OpenClaw.

Event runtime mencakup:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Event transkrip juga direkonstruksi dari branch sesi aktif:

- pesan pengguna
- pesan asisten
- panggilan tool
- hasil tool
- compaction
- perubahan model
- label dan entri sesi kustom

Event ditulis sebagai JSON Lines dengan penanda skema ini:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File bundel

Bundel yang diekspor dapat berisi:

| File                  | Isi                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `manifest.json`       | Skema bundel, file sumber, jumlah event, dan daftar file yang dihasilkan                        |
| `events.jsonl`        | Linimasa runtime dan transkrip berurutan                                                        |
| `session-branch.json` | Branch transkrip aktif yang telah disunting dan header sesi                                     |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot config, plugin, skill, dan metadata prompt          |
| `artifacts.json`      | Status akhir, error, usage, prompt cache, jumlah compaction, teks asisten, dan metadata tool    |
| `prompts.json`        | Prompt yang dikirim dan detail terpilih dari pembangunan prompt                                 |
| `system-prompt.txt`   | System prompt terkompilasi terbaru, ketika berhasil diambil                                     |
| `tools.json`          | Definisi tool yang dikirim ke model, ketika berhasil diambil                                    |

`manifest.json` mencantumkan file yang ada dalam bundel tersebut. Beberapa file dihilangkan
ketika sesi tidak mengambil data runtime yang terkait.

## Lokasi pengambilan

Secara default, event trajectory runtime ditulis di samping file sesi:

```text
<session>.trajectory.jsonl
```

OpenClaw juga menulis file pointer best-effort di samping sesi:

```text
<session>.trajectory-path.json
```

Setel `OPENCLAW_TRAJECTORY_DIR` untuk menyimpan sidecar trajectory runtime di
direktori khusus:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Ketika variabel ini diatur, OpenClaw menulis satu file JSONL per session id di
direktori tersebut.

## Nonaktifkan pengambilan

Setel `OPENCLAW_TRAJECTORY=0` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan pengambilan trajectory runtime. `/export-trajectory` tetap dapat mengekspor
branch transkrip, tetapi file khusus runtime seperti konteks terkompilasi,
artefak provider, dan metadata prompt mungkin tidak ada.

## Privasi dan batas

Bundel trajectory dirancang untuk dukungan dan debugging, bukan untuk diposting secara publik.
OpenClaw menyunting nilai sensitif sebelum menulis file ekspor:

- kredensial dan field payload yang diketahui mirip secret
- data gambar
- path state lokal
- path workspace, diganti dengan `$WORKSPACE_DIR`
- path direktori home, jika terdeteksi

Eksportir juga membatasi ukuran input:

- file sidecar runtime: 50 MiB
- file sesi: 50 MiB
- event runtime: 200.000
- total event yang diekspor: 250.000
- baris event runtime individual dipotong di atas 256 KiB

Tinjau bundel sebelum membagikannya di luar tim Anda. Penyuntingan bersifat best-effort
dan tidak dapat mengetahui setiap secret spesifik aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki event runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- periksa apakah `OPENCLAW_TRAJECTORY_DIR` menunjuk ke direktori yang dapat ditulisi
- jalankan pesan lain di sesi tersebut, lalu ekspor lagi
- periksa `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak path output:

- gunakan nama relatif seperti `bug-1234`
- jangan teruskan `/tmp/...` atau `~/...`
- simpan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal dengan error ukuran, sesi atau sidecar melebihi
batas keamanan ekspor. Mulailah sesi baru atau ekspor reproduksi yang lebih kecil.

## Terkait

- [Diffs](/id/tools/diffs)
- [Manajemen sesi](/id/concepts/session)
- [Tool exec](/id/tools/exec)
