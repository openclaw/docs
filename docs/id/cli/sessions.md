---
read_when:
    - Anda ingin mencantumkan sesi tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (daftar sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-06-27T17:20:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Mencantumkan sesi percakapan yang tersimpan.

Daftar sesi bukan pemeriksaan kelangsungan channel/provider. Daftar ini menampilkan baris percakapan yang dipertahankan dari penyimpanan sesi. Discord, Slack, Telegram, atau channel lain yang senyap dapat tersambung kembali dengan sukses tanpa membuat baris sesi baru sampai sebuah pesan diproses. Gunakan `openclaw channels status --probe`, `openclaw status --deep`, atau `openclaw health --verbose` ketika Anda memerlukan konektivitas channel langsung.

Respons `openclaw sessions` dan Gateway `sessions.list` dibatasi secara default agar penyimpanan besar yang berumur panjang tidak dapat memonopoli proses CLI atau event loop Gateway. CLI mengembalikan 100 sesi terbaru secara default; berikan `--limit <n>` untuk jendela yang lebih kecil/besar atau `--limit all` ketika Anda secara sengaja memerlukan seluruh penyimpanan. Respons JSON menyertakan `totalCount`, `limitApplied`, dan `hasMore` ketika pemanggil perlu menunjukkan bahwa ada lebih banyak baris.

Klien RPC dapat meneruskan `configuredAgentsOnly: true` untuk mempertahankan sumber penemuan gabungan yang luas tetapi hanya mengembalikan baris untuk agent yang saat ini ada di konfigurasi. Control UI menggunakan mode itu secara default sehingga penyimpanan agent yang dihapus atau hanya ada di disk tidak muncul kembali di tampilan Sessions.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Pemilihan cakupan:

- default: penyimpanan agent default yang dikonfigurasi
- `--verbose`: logging verbose
- `--agent <id>`: satu penyimpanan agent yang dikonfigurasi
- `--all-agents`: menggabungkan semua penyimpanan agent yang dikonfigurasi
- `--store <path>`: jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)
- `--limit <n|all>`: baris maksimum untuk output (default `100`; `all` memulihkan output penuh)

Ikuti progres trajectory yang mudah dibaca manusia untuk sesi tersimpan:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` merender event JSONL trajectory terbaru sebagai baris progres ringkas. Tanpa `--session-key`, perintah ini mengikuti sesi yang sedang berjalan terlebih dahulu, lalu sesi tersimpan terbaru. `--tail <count>` mengontrol berapa banyak event yang sudah ada dicetak sebelum mode follow; default-nya adalah `80`, dan `0` dimulai di akhir saat ini. `--follow` terus memantau file trajectory yang dipilih, termasuk file yang dipindahkan dan dirujuk oleh `<session>.trajectory-path.json`.

Tampilan progres sengaja konservatif: teks prompt, argumen tool, dan isi hasil tool tidak dicetak. Panggilan tool menampilkan nama tool dengan `{...redacted...}`; hasil tool menampilkan status seperti `ok`, `error`, atau `done`; baris penyelesaian model menampilkan provider/model dan status terminal.

Ekspor bundel trajectory untuk sesi tersimpan:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah slash `/export-trajectory` setelah pemilik menyetujui permintaan exec. Direktori output selalu di-resolve di dalam `.openclaw/trajectory-exports/` di bawah workspace yang dipilih.

`openclaw sessions --all-agents` membaca penyimpanan agent yang dikonfigurasi. Penemuan sesi Gateway dan ACP lebih luas: keduanya juga menyertakan penyimpanan yang hanya ada di disk yang ditemukan di bawah root `agents/` default atau root `session.store` bertemplat. Penyimpanan yang ditemukan itu harus di-resolve ke file `sessions.json` reguler di dalam root agent; symlink dan jalur di luar root dilewati.

Contoh JSON:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Pemeliharaan pembersihan

Jalankan pemeliharaan sekarang (alih-alih menunggu siklus tulis berikutnya):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` menggunakan pengaturan `session.maintenance` dari konfigurasi:

- Catatan cakupan: `openclaw sessions cleanup` memelihara penyimpanan sesi, transkrip, dan sidecar trajectory. Perintah ini tidak memangkas riwayat eksekusi Cron, yang dikelola oleh `cron.runLog.keepLines` di [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan di [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).
- Pembersihan juga memangkas transkrip primer tanpa referensi, checkpoint Compaction, dan sidecar trajectory yang lebih lama dari `session.maintenance.pruneAfter`; file yang masih dirujuk oleh `sessions.json` dipertahankan.
- Pembersihan melaporkan pembersihan probe model-run gateway yang berumur pendek secara terpisah sebagai `modelRunPruned`. Ini hanya cocok dengan kunci eksplisit ketat yang berbentuk seperti `agent:*:explicit:model-run-<uuid>`. Retensi tetapnya adalah `24h`, tetapi dibatasi tekanan: ini hanya menghapus baris probe usang ketika pemeliharaan entri sesi/tekanan batas tercapai. Saat berjalan, pembersihan model-run terjadi sebelum pembersihan usang global dan pembatasan.

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) plus ringkasan yang dikelompokkan berdasarkan label sesi sehingga Anda dapat melihat apa yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan bahkan ketika `session.maintenance.mode` adalah `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang atau hanya header/kosong, meskipun biasanya belum akan keluar karena umur/jumlah.
- `--fix-dm-scope`: ketika `session.dmScope` adalah `main`, pensiunkan baris DM langsung berbasis peer yang usang dan tertinggal oleh perutean `per-peer`, `per-channel-peer`, atau `per-account-channel-peer` sebelumnya. Gunakan `--dry-run` terlebih dahulu; menerapkan pembersihan menghapus baris tersebut dari `sessions.json` dan mempertahankan transkripnya sebagai arsip terhapus.
- `--active-key <key>`: lindungi kunci aktif tertentu dari penggusuran anggaran disk. Pointer percakapan eksternal yang tahan lama, seperti sesi grup dan sesi chat bercakupan thread, juga dipertahankan oleh pemeliharaan umur/jumlah/anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu penyimpanan agent yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua penyimpanan agent yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, output menyertakan satu ringkasan per penyimpanan.

Ketika Gateway dapat dijangkau, pembersihan non-dry-run untuk penyimpanan agent yang dikonfigurasi dikirim melalui Gateway sehingga berbagi penulis penyimpanan sesi yang sama dengan lalu lintas runtime. Gunakan `--store <path>` untuk perbaikan offline eksplisit pada file penyimpanan.

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

## Padatkan sesi

Pulihkan anggaran konteks untuk sesi yang macet atau terlalu besar. `openclaw sessions compact <key>` adalah wrapper kelas utama di sekitar RPC gateway `sessions.compact` dan memerlukan gateway yang sedang berjalan.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Tanpa `--max-lines`, gateway meringkas transkrip dengan LLM. Ini dapat lambat, sehingga default `--timeout` adalah `180000` ms.
- Dengan `--max-lines <n>`, perintah ini memotong ke `n` baris transkrip terakhir dan mengarsipkan transkrip sebelumnya sebagai sidecar `.bak`.
- `--agent <id>`: agent yang memiliki sesi; wajib untuk kunci `global`.
- `--url` / `--token` / `--password`: override koneksi gateway.
- `--timeout <ms>`: timeout RPC dalam milidetik.
- `--json`: cetak payload RPC mentah.

Perintah keluar non-zero ketika gateway melaporkan Compaction gagal atau tidak dapat dijangkau, sehingga cron dan script tidak pernah salah mengira no-op senyap sebagai keberhasilan.

> Catatan: `openclaw agent --message '/compact ...'` **bukan** jalur Compaction. Perintah slash dari CLI ditolak oleh pemeriksaan authorized-sender; pemanggilan tersebut keluar non-zero dengan panduan yang mengarah ke sini, alih-alih melakukan no-op secara senyap.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` menerima:

| Bidang     | Tipe        | Wajib | Deskripsi                                                   |
| ---------- | ----------- | ----- | ----------------------------------------------------------- |
| `key`      | string      | ya    | Kunci sesi untuk dipadatkan (misalnya `agent:main:main`).   |
| `agentId`  | string      | tidak | ID agent yang memiliki sesi (untuk kunci `global`).         |
| `maxLines` | integer ≥ 1 | tidak | Potong ke N baris terakhir alih-alih ringkasan LLM.         |

Contoh respons ringkasan LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Contoh respons pemotongan (`--max-lines 200`):

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

- Konfigurasi sesi: [Referensi konfigurasi](/id/gateway/config-agents#session)
- [Referensi CLI](/id/cli)
- [Manajemen sesi](/id/concepts/session)
