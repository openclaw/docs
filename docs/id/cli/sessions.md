---
read_when:
    - Anda ingin menampilkan daftar sesi yang tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (daftar sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-05-05T01:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Cantumkan sesi percakapan yang tersimpan.

Daftar sesi bukan pemeriksaan keaktifan channel/provider. Daftar ini menampilkan baris percakapan yang dipersisten dari penyimpanan sesi. Discord, Slack, Telegram, atau channel lain yang sepi dapat tersambung ulang dengan sukses tanpa membuat baris sesi baru sampai pesan diproses. Gunakan `openclaw channels status --probe`, `openclaw status --deep`, atau `openclaw health --verbose` saat Anda membutuhkan konektivitas channel langsung.

Respons `openclaw sessions` dan Gateway `sessions.list` dibatasi secara default agar penyimpanan besar yang berumur panjang tidak memonopoli proses CLI atau event loop Gateway. CLI mengembalikan 100 sesi terbaru secara default; berikan `--limit <n>` untuk jendela yang lebih kecil/besar atau `--limit all` saat Anda sengaja membutuhkan seluruh penyimpanan. Respons JSON menyertakan `totalCount`, `limitApplied`, dan `hasMore` saat pemanggil perlu menunjukkan bahwa ada lebih banyak baris.

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

- default: penyimpanan agen default yang dikonfigurasi
- `--verbose`: pencatatan verbose
- `--agent <id>`: satu penyimpanan agen yang dikonfigurasi
- `--all-agents`: gabungkan semua penyimpanan agen yang dikonfigurasi
- `--store <path>`: jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)
- `--limit <n|all>`: jumlah baris maksimum untuk dikeluarkan (default `100`; `all` memulihkan keluaran penuh)

Ekspor bundel trajektori untuk sesi tersimpan:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah slash `/export-trajectory` setelah pemilik menyetujui permintaan eksekusi. Direktori keluaran selalu diselesaikan di dalam `.openclaw/trajectory-exports/` di bawah workspace yang dipilih.

`openclaw sessions --all-agents` membaca penyimpanan agen yang dikonfigurasi. Penemuan sesi Gateway dan ACP lebih luas: keduanya juga menyertakan penyimpanan yang hanya ada di disk yang ditemukan di bawah root `agents/` default atau root `session.store` bertemplat. Penyimpanan yang ditemukan tersebut harus diselesaikan menjadi file `sessions.json` reguler di dalam root agen; symlink dan jalur di luar root dilewati.

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

Jalankan pemeliharaan sekarang (alih-alih menunggu siklus penulisan berikutnya):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` menggunakan pengaturan `session.maintenance` dari konfigurasi:

- Catatan cakupan: `openclaw sessions cleanup` memelihara penyimpanan sesi, transkrip, dan sidecar trajektori. Perintah ini tidak memangkas log run cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` dalam [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan dalam [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat apa yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan bahkan saat `session.maintenance.mode` bernilai `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun biasanya entri tersebut belum akan dikeluarkan berdasarkan usia/jumlah.
- `--active-key <key>`: lindungi kunci aktif tertentu dari penggusuran karena anggaran disk. Penunjuk percakapan eksternal yang tahan lama, seperti sesi grup dan sesi chat bercakupan thread, juga dipertahankan oleh pemeliharaan usia/jumlah/anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu penyimpanan agen yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua penyimpanan agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, keluaran menyertakan satu ringkasan per penyimpanan.

Saat Gateway dapat dijangkau, pembersihan non-dry-run untuk penyimpanan agen yang dikonfigurasi dikirim melalui Gateway agar menggunakan penulis penyimpanan sesi yang sama dengan lalu lintas runtime. Gunakan `--store <path>` untuk perbaikan offline eksplisit atas file penyimpanan.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Terkait:

- Konfigurasi sesi: [Referensi konfigurasi](/id/gateway/config-agents#session)

## Terkait

- [Referensi CLI](/id/cli)
- [Manajemen sesi](/id/concepts/session)
