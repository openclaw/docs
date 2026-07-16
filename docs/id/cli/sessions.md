---
read_when:
    - Anda ingin mencantumkan sesi yang tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (mencantumkan sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-07-16T17:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Mencantumkan sesi percakapan yang tersimpan.

Daftar sesi bukanlah pemeriksaan keaktifan channel/provider. Daftar ini menampilkan baris
percakapan yang dipersistenkan dari penyimpanan sesi. Discord, Slack, Telegram, atau
channel lain yang tidak aktif dapat berhasil terhubung kembali tanpa membuat baris sesi baru
hingga sebuah pesan diproses. Gunakan `openclaw channels status --probe`,
`openclaw status --deep`, atau `openclaw health --verbose` saat Anda memerlukan
konektivitas channel langsung.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Flag:

| Flag                 | Deskripsi                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Satu penyimpanan agen yang dikonfigurasi (default: agen default yang dikonfigurasi).        |
| `--all-agents`       | Menggabungkan semua penyimpanan agen yang dikonfigurasi.                                 |
| `--store <path>`     | Jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`). |
| `--active <minutes>` | Hanya menampilkan sesi yang diperbarui dalam N menit terakhir.                  |
| `--limit <n\|all>`   | Jumlah maksimum baris yang dihasilkan (default `100`; `all` memulihkan keluaran penuh).        |
| `--json`             | Keluaran yang dapat dibaca mesin.                                               |
| `--verbose`          | Pencatatan log terperinci.                                                       |

`openclaw sessions` dan RPC Gateway `sessions.list` dibatasi secara default
agar penyimpanan besar yang berumur panjang tidak dapat memonopoli proses CLI atau loop
peristiwa Gateway. Secara default, CLI mengembalikan 100 sesi terbaru; berikan `--limit <n>`
untuk rentang yang lebih kecil/besar atau `--limit all` ketika Anda sengaja memerlukan
seluruh penyimpanan. Respons JSON menyertakan `totalCount`, `limitApplied`, dan `hasMore`
ketika pemanggil perlu menunjukkan bahwa masih ada baris lain.

Klien RPC dapat memberikan `configuredAgentsOnly: true` untuk mempertahankan sumber
penemuan gabungan yang luas, tetapi hanya mengembalikan baris untuk agen yang saat ini ada dalam konfigurasi.
Control UI menggunakan mode tersebut secara default agar penyimpanan agen yang dihapus atau hanya ada di disk
tidak muncul kembali dalam tampilan Sesi.

`--all-agents` membaca penyimpanan agen yang dikonfigurasi. Penemuan sesi
Gateway dan ACP lebih luas: keduanya juga menyertakan penyimpanan SQLite yang ditemukan dari
root agen yang dikonfigurasi atau root `session.store` bertemplat. Jalur pemilih
lama harus ditemukan di dalam root agen; symlink dan jalur di luar root
dilewati.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Memantau progres lintasan

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` merender peristiwa lintasan runtime terbaru sebagai baris
progres ringkas. Tanpa `--session-key`, perintah ini terlebih dahulu memantau sesi yang berjalan, lalu
sesi tersimpan terbaru. `--tail <count>` mengontrol jumlah peristiwa yang sudah ada
yang dicetak sebelum mode ikuti; default `80`, dan `0` dimulai dari bagian akhir saat ini.
`--follow` terus memantau sesi terpilih yang didukung SQLite atau file
lintasan lama eksplisit.

Tampilan progres sengaja dibuat konservatif: teks prompt, argumen alat,
dan isi hasil alat tidak dicetak. Pemanggilan alat menampilkan nama alat dengan
`{...redacted...}`; hasil alat menampilkan status seperti `ok`, `error`, atau `done`;
baris penyelesaian model menampilkan provider/model dan status terminal.

## Mengekspor bundel lintasan

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah garis miring `/export-trajectory` setelah
pemilik menyetujui permintaan eksekusi. Direktori keluaran selalu ditemukan
di dalam `.openclaw/trajectory-exports/` pada ruang kerja yang dipilih.

## Pemeliharaan pembersihan

Jalankan pemeliharaan sekarang alih-alih menunggu siklus penulisan berikutnya:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` menggunakan pengaturan `session.maintenance` dari konfigurasi
([Referensi konfigurasi](/id/gateway/config-agents#session)):

- Catatan cakupan: `openclaw sessions cleanup` memelihara penyimpanan sesi,
  transkrip, baris lintasan, dan file pendamping lintasan lama. Perintah ini tidak
  memangkas riwayat eksekusi Cron, yang secara otomatis mempertahankan 2000 baris terbaru per pekerjaan
  ([Konfigurasi Cron](/id/automation/cron-jobs#configuration)).
- Pembersihan juga memangkas artefak transkrip lama/arsip yang tidak dirujuk,
  titik pemeriksaan Compaction, dan file pendamping lintasan yang lebih lama dari
  `session.maintenance.pruneAfter`; artefak yang masih dirujuk oleh baris sesi SQLite
  dipertahankan.
- Pembersihan melaporkan pembersihan probe eksekusi model Gateway berumur pendek secara terpisah sebagai
  `modelRunPruned`. Ini hanya cocok dengan kunci eksplisit ketat yang berbentuk seperti
  `agent:*:explicit:model-run-<uuid>`. Retensinya ditetapkan sebesar `24h` dan
  dibatasi oleh tekanan: baris probe usang hanya dihapus ketika tekanan
  pemeliharaan/batas entri sesi tercapai. Ketika dijalankan, pembersihan eksekusi model
  dilakukan sebelum pembersihan global untuk data usang dan pembatasan.

Flag:

| Flag                 | Deskripsi                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Menampilkan pratinjau jumlah entri yang akan dipangkas/dibatasi tanpa melakukan penulisan. Dalam mode teks, mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) serta ringkasan yang dikelompokkan berdasarkan label sesi.                                                                                                       |
| `--enforce`          | Menerapkan pemeliharaan meskipun `session.maintenance.mode` adalah `warn`.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Menghapus entri lama yang artefak transkrip arsipnya hilang atau hanya berisi header/kosong, meskipun entri tersebut biasanya belum akan dikeluarkan berdasarkan usia/jumlah.                                                                                                                                                             |
| `--fix-dm-scope`     | Ketika `session.dmScope` adalah `main`, menghentikan baris DM langsung berkunci peer yang sudah usang dan ditinggalkan oleh perutean `per-peer`, `per-channel-peer`, atau `per-account-channel-peer` sebelumnya. Gunakan `--dry-run` terlebih dahulu; penerapannya menghapus baris tersebut dari SQLite dan mempertahankan artefak transkrip lamanya sebagai arsip yang dihapus. |
| `--active-key <key>` | Melindungi kunci aktif tertentu dari pengusiran akibat anggaran disk. Penunjuk percakapan eksternal yang tahan lama, seperti sesi grup dan sesi obrolan bercakupan utas, juga dipertahankan oleh pemeliharaan usia/jumlah/anggaran disk.                                                                                               |
| `--agent <id>`       | Menjalankan pembersihan untuk satu penyimpanan agen yang dikonfigurasi.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Menjalankan pembersihan untuk semua penyimpanan agen yang dikonfigurasi.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Menjalankan pembersihan terhadap jalur pemilih penyimpanan lama tertentu.                                                                                                                                                                                                                                                         |
| `--json`             | Mencetak ringkasan JSON. Dengan `--all-agents`, keluaran menyertakan satu ringkasan per penyimpanan.                                                                                                                                                                                                                          |

Ketika Gateway dapat dijangkau, pembersihan selain simulasi untuk penyimpanan agen yang dikonfigurasi
dikirim melalui Gateway agar menggunakan penulis penyimpanan sesi yang sama dengan lalu lintas
runtime. Gunakan `--store <path>` untuk perbaikan luring eksplisit pada pemilih
penyimpanan lama.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Memadatkan sesi

Mengambil kembali anggaran konteks untuk sesi yang macet atau terlalu besar. `openclaw sessions
compact <key>` adalah pembungkus kelas utama untuk RPC Gateway `sessions.compact`
dan memerlukan Gateway yang sedang berjalan.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Tanpa `--max-lines`, Gateway menggunakan LLM untuk meringkas transkrip. Secara default, CLI
  tidak menetapkan tenggat klien; Gateway mengelola siklus hidup
  Compaction yang dikonfigurasi.
- Dengan `--max-lines <n>`, transkrip dipangkas hingga `n` baris terakhir dan
  transkrip sebelumnya diarsipkan sebagai file pendamping `.bak`.
- `--agent <id>`: agen yang memiliki sesi; wajib untuk kunci `global`.
- `--url` / `--token` / `--password`: penggantian koneksi Gateway.
- `--timeout <ms>`: batas waktu RPC sisi klien opsional dalam milidetik.
- `--json`: mencetak payload RPC mentah.

Perintah keluar dengan status non-zero ketika Gateway melaporkan Compaction yang gagal atau tidak
dapat dijangkau, sehingga cron dan skrip tidak pernah menganggap no-op tanpa keluaran sebagai keberhasilan.

<Note>
`openclaw agent --message '/compact ...'` **bukan** jalur Compaction. Perintah
slash dari CLI ditolak oleh pemeriksaan pengirim yang diotorisasi; pemanggilan
tersebut keluar dengan status non-zero disertai panduan yang mengarah ke sini,
alih-alih melakukan no-op tanpa keluaran.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` menerima:

| Bidang     | Tipe        | Wajib | Deskripsi                                                  |
| ---------- | ----------- | ----- | ---------------------------------------------------------- |
| `key`      | string      | ya    | Kunci sesi yang akan di-compact (misalnya `agent:main:main`). |
| `agentId`  | string      | tidak | ID agen pemilik sesi (untuk kunci `global`).          |
| `maxLines` | integer ≥ 1 | tidak | Pangkas hingga N baris terakhir sebagai pengganti peringkasan LLM. |

Contoh respons peringkasan LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Contoh respons pemangkasan (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Terkait

- [Konfigurasi sesi](/id/gateway/config-agents#session)
- [Pengelolaan sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Referensi CLI](/id/cli)
