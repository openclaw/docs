---
read_when:
    - Anda ingin menampilkan daftar sesi yang tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (mencantumkan sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-05-07T13:14:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Cantumkan sesi percakapan yang tersimpan.

Daftar sesi bukan pemeriksaan keaktifan saluran/penyedia. Daftar ini menampilkan baris percakapan yang dipertahankan dari penyimpanan sesi. Discord, Slack, Telegram, atau saluran lain yang sepi dapat tersambung kembali dengan berhasil tanpa membuat baris sesi baru sampai sebuah pesan diproses. Gunakan `openclaw channels status --probe`, `openclaw status --deep`, atau `openclaw health --verbose` saat Anda memerlukan konektivitas saluran langsung.

Respons `openclaw sessions` dan Gateway `sessions.list` dibatasi secara default agar penyimpanan besar yang berumur panjang tidak dapat memonopoli proses CLI atau loop peristiwa Gateway. CLI mengembalikan 100 sesi terbaru secara default; berikan `--limit <n>` untuk jendela yang lebih kecil/lebih besar atau `--limit all` saat Anda memang memerlukan seluruh penyimpanan. Respons JSON menyertakan `totalCount`, `limitApplied`, dan `hasMore` saat pemanggil perlu menunjukkan bahwa ada lebih banyak baris.

Klien RPC dapat memberikan `configuredAgentsOnly: true` untuk mempertahankan sumber penemuan gabungan yang luas tetapi hanya mengembalikan baris untuk agen yang saat ini ada dalam konfigurasi. Control UI menggunakan mode itu secara default agar penyimpanan agen yang dihapus atau hanya ada di disk tidak muncul kembali di tampilan Sesi.

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
- `--verbose`: pencatatan log mendetail
- `--agent <id>`: satu penyimpanan agen yang dikonfigurasi
- `--all-agents`: gabungkan semua penyimpanan agen yang dikonfigurasi
- `--store <path>`: jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)
- `--limit <n|all>`: jumlah baris maksimum untuk keluaran (default `100`; `all` memulihkan keluaran penuh)

Ekspor bundel trajektori untuk sesi yang tersimpan:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah garis miring `/export-trajectory` setelah pemilik menyetujui permintaan eksekusi. Direktori keluaran selalu diselesaikan di dalam `.openclaw/trajectory-exports/` di bawah ruang kerja yang dipilih.

`openclaw sessions --all-agents` membaca penyimpanan agen yang dikonfigurasi. Penemuan sesi Gateway dan ACP lebih luas: keduanya juga menyertakan penyimpanan yang hanya ada di disk yang ditemukan di bawah akar `agents/` default atau akar `session.store` bertemplat. Penyimpanan yang ditemukan tersebut harus mengarah ke file `sessions.json` reguler di dalam akar agen; symlink dan jalur di luar akar dilewati.

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

- Catatan cakupan: `openclaw sessions cleanup` memelihara penyimpanan sesi, transkrip, dan sidecar trajektori. Perintah ini tidak memangkas log eksekusi cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` dalam [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan dalam [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).
- Pembersihan juga memangkas transkrip utama yang tidak direferensikan, titik pemeriksaan Compaction, dan sidecar trajektori yang lebih lama dari `session.maintenance.pruneAfter`; file yang masih direferensikan oleh `sessions.json` dipertahankan.

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat apa yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan meskipun `session.maintenance.mode` adalah `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun entri tersebut biasanya belum akan dikeluarkan karena umur/jumlah.
- `--fix-dm-scope`: saat `session.dmScope` adalah `main`, pensiunkan baris DM langsung berbasis kunci peer yang usang yang ditinggalkan oleh perutean `per-peer`, `per-channel-peer`, atau `per-account-channel-peer` sebelumnya. Gunakan `--dry-run` terlebih dahulu; menerapkan pembersihan menghapus baris tersebut dari `sessions.json` dan mempertahankan transkripnya sebagai arsip yang dihapus.
- `--active-key <key>`: lindungi kunci aktif tertentu dari pengusiran karena anggaran disk. Penunjuk percakapan eksternal yang tahan lama, seperti sesi grup dan sesi obrolan bercakupan thread, juga dipertahankan oleh pemeliharaan umur/jumlah/anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu penyimpanan agen yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua penyimpanan agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, keluaran menyertakan satu ringkasan per penyimpanan.

Saat Gateway dapat dijangkau, pembersihan non-dry-run untuk penyimpanan agen yang dikonfigurasi dikirim melalui Gateway sehingga menggunakan penulis penyimpanan sesi yang sama dengan lalu lintas runtime. Gunakan `--store <path>` untuk perbaikan luring eksplisit pada file penyimpanan.

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

Terkait:

- Konfigurasi sesi: [Referensi konfigurasi](/id/gateway/config-agents#session)

## Terkait

- [Referensi CLI](/id/cli)
- [Manajemen sesi](/id/concepts/session)
