---
read_when:
    - Menelusuri mengapa agen menjawab, gagal, atau memanggil alat dengan cara tertentu
    - Mengekspor bundel dukungan untuk sesi OpenClaw
    - Menyelidiki konteks prompt, pemanggilan alat, kesalahan runtime, atau metadata penggunaan
    - Menonaktifkan atau memindahkan perekaman trajektori
summary: Ekspor bundel trajektori yang telah disunting untuk pemecahan masalah sesi agen OpenClaw
title: Bundel trajektori
x-i18n:
    generated_at: "2026-04-30T10:17:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Perekaman trajektori adalah perekam per sesi milik OpenClaw. Ini merekam
linimasa terstruktur untuk setiap agent run, lalu `/export-trajectory` mengemas
sesi saat ini menjadi bundel dukungan yang telah diredaksi.

Gunakan ketika Anda perlu menjawab pertanyaan seperti:

- Prompt, system prompt, dan tool apa yang dikirim ke model?
- Pesan transkrip dan tool call mana yang menghasilkan jawaban ini?
- Apakah run tersebut kehabisan waktu, dibatalkan, mengalami pemadatan, atau terkena galat penyedia?
- Model, Plugin, Skills, dan pengaturan runtime mana yang aktif?
- Metadata penggunaan dan prompt-cache apa yang dikembalikan penyedia?

Jika Anda mengirim laporan dukungan luas untuk masalah Gateway live, mulai dengan
[`/diagnostics`](/id/gateway/diagnostics#chat-command). Diagnostics mengumpulkan
bundel Gateway yang telah disanitasi dan, untuk sesi OpenAI Codex harness, juga dapat mengirim
umpan balik Codex ke server OpenAI setelah disetujui. Gunakan `/export-trajectory` ketika
Anda secara khusus memerlukan linimasa prompt, tool, dan transkrip per sesi yang mendetail.

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

Bundel trajektori dapat berisi prompt, pesan model, skema tool, hasil tool,
peristiwa runtime, dan jalur lokal. Karena itu, perintah slash chat selalu berjalan
melalui persetujuan exec. Setujui ekspor sekali ketika Anda memang ingin
membuat bundel; jangan gunakan allow-all. Di chat grup, OpenClaw mengirim
prompt persetujuan dan hasil ekspor kepada pemilik secara privat, bukan memposting
detail trajektori kembali ke ruang bersama.

Untuk inspeksi lokal atau alur kerja dukungan, Anda juga dapat menjalankan jalur
perintah yang disetujui secara langsung:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Akses

Ekspor trajektori adalah perintah pemilik. Pengirim harus lolos pemeriksaan
otorisasi perintah normal dan pemeriksaan pemilik untuk channel tersebut.

## Yang direkam

Perekaman trajektori aktif secara default untuk OpenClaw agent run.

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
- tool call
- hasil tool
- pemadatan
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

| File                  | Isi                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Skema bundel, file sumber, jumlah peristiwa, dan daftar file yang dihasilkan                   |
| `events.jsonl`        | Linimasa runtime dan transkrip yang berurutan                                                  |
| `session-branch.json` | Cabang transkrip aktif yang telah diredaksi dan header sesi                                    |
| `metadata.json`       | Versi OpenClaw, OS/runtime, model, snapshot konfigurasi, Plugin, Skills, dan metadata prompt   |
| `artifacts.json`      | Status akhir, galat, penggunaan, prompt cache, jumlah pemadatan, teks asisten, dan metadata tool |
| `prompts.json`        | Prompt yang dikirim dan detail pembuatan prompt yang dipilih                                   |
| `system-prompt.txt`   | System prompt terkompilasi terbaru, ketika terekam                                             |
| `tools.json`          | Definisi tool yang dikirim ke model, ketika terekam                                            |

`manifest.json` mencantumkan file yang ada dalam bundel tersebut. Beberapa file dihilangkan
ketika sesi tidak merekam data runtime yang sesuai.

## Lokasi perekaman

Secara default, peristiwa trajektori runtime ditulis di samping file sesi:

```text
<session>.trajectory.jsonl
```

OpenClaw juga menulis file penunjuk best-effort di samping sesi:

```text
<session>.trajectory-path.json
```

Atur `OPENCLAW_TRAJECTORY_DIR` untuk menyimpan sidecar trajektori runtime di
direktori khusus:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Ketika variabel ini diatur, OpenClaw menulis satu file JSONL per id sesi di
direktori tersebut.

Pemeliharaan sesi menghapus sidecar trajektori ketika entri sesi pemiliknya
dipangkas, dibatasi, atau dikeluarkan oleh anggaran disk sesi. File runtime di luar
direktori sesi hanya dihapus ketika target penunjuk masih membuktikan bahwa file itu
milik sesi tersebut.

## Nonaktifkan perekaman

Atur `OPENCLAW_TRAJECTORY=0` sebelum memulai OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Ini menonaktifkan perekaman trajektori runtime. `/export-trajectory` masih dapat mengekspor
cabang transkrip, tetapi file khusus runtime seperti konteks terkompilasi,
artefak penyedia, dan metadata prompt mungkin hilang.

## Privasi dan batas

Bundel trajektori dirancang untuk dukungan dan debugging, bukan untuk diposting publik.
OpenClaw meredaksi nilai sensitif sebelum menulis file ekspor:

- kredensial dan field payload yang diketahui mirip rahasia
- data gambar
- jalur state lokal
- jalur workspace, diganti dengan `$WORKSPACE_DIR`
- jalur direktori home, jika terdeteksi

Eksportir juga membatasi ukuran input:

- file sidecar runtime: 50 MiB
- file sesi: 50 MiB
- peristiwa runtime: 200.000
- total peristiwa yang diekspor: 250.000
- baris peristiwa runtime individual dipotong jika melebihi 256 KiB

Tinjau bundel sebelum membagikannya di luar tim Anda. Redaksi bersifat best-effort
dan tidak dapat mengetahui setiap rahasia khusus aplikasi.

## Pemecahan masalah

Jika ekspor tidak memiliki peristiwa runtime:

- pastikan OpenClaw dimulai tanpa `OPENCLAW_TRAJECTORY=0`
- periksa apakah `OPENCLAW_TRAJECTORY_DIR` mengarah ke direktori yang dapat ditulis
- jalankan pesan lain di sesi tersebut, lalu ekspor lagi
- periksa `manifest.json` untuk `runtimeEventCount`

Jika perintah menolak jalur keluaran:

- gunakan nama relatif seperti `bug-1234`
- jangan meneruskan `/tmp/...` atau `~/...`
- simpan ekspor di dalam `.openclaw/trajectory-exports/`

Jika ekspor gagal dengan galat ukuran, sesi atau sidecar melebihi
batas keamanan ekspor. Mulai sesi baru atau ekspor reproduksi yang lebih kecil.

## Terkait

- [Diffs](/id/tools/diffs)
- [Manajemen sesi](/id/concepts/session)
- [Tool exec](/id/tools/exec)
