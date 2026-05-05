---
read_when:
    - Anda ingin menampilkan daftar sesi yang tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (mencantumkan sesi yang tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-05-05T08:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Cantumkan sesi percakapan yang tersimpan.

Daftar sesi bukan pemeriksaan keaktifan saluran/penyedia. Daftar ini menampilkan baris percakapan yang dipertahankan dari penyimpanan sesi. Discord, Slack, Telegram, atau saluran lain yang senyap dapat tersambung ulang dengan sukses tanpa membuat baris sesi baru sampai sebuah pesan diproses. Gunakan `openclaw channels status --probe`, `openclaw status --deep`, atau `openclaw health --verbose` saat Anda memerlukan konektivitas saluran langsung.

Respons `openclaw sessions` dan Gateway `sessions.list` dibatasi secara default agar penyimpanan besar yang berumur panjang tidak memonopoli proses CLI atau event loop Gateway. CLI mengembalikan 100 sesi terbaru secara default; berikan `--limit <n>` untuk jendela yang lebih kecil/besar atau `--limit all` saat Anda memang memerlukan seluruh penyimpanan. Respons JSON menyertakan `totalCount`, `limitApplied`, dan `hasMore` saat pemanggil perlu menunjukkan bahwa ada lebih banyak baris.

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
- `--verbose`: pencatatan log verbose
- `--agent <id>`: satu penyimpanan agen yang dikonfigurasi
- `--all-agents`: agregasikan semua penyimpanan agen yang dikonfigurasi
- `--store <path>`: jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)
- `--limit <n|all>`: jumlah baris maksimum untuk dikeluarkan (default `100`; `all` memulihkan output penuh)

Ekspor bundel trajectory untuk sesi tersimpan:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah slash `/export-trajectory` setelah pemilik menyetujui permintaan eksekusi. Direktori output selalu diselesaikan di dalam `.openclaw/trajectory-exports/` di bawah workspace yang dipilih.

`openclaw sessions --all-agents` membaca penyimpanan agen yang dikonfigurasi. Penemuan sesi Gateway dan ACP lebih luas: keduanya juga menyertakan penyimpanan khusus disk yang ditemukan di bawah root default `agents/` atau root `session.store` bertemplat. Penyimpanan yang ditemukan tersebut harus terselesaikan ke file `sessions.json` reguler di dalam root agen; symlink dan jalur di luar root dilewati.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` menggunakan pengaturan `session.maintenance` dari konfigurasi:

- Catatan cakupan: `openclaw sessions cleanup` memelihara penyimpanan sesi, transkrip, dan sidecar trajectory. Perintah ini tidak memangkas log eksekusi cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` di [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan di [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).
- Pembersihan juga memangkas transkrip utama yang tidak dirujuk, checkpoint Compaction, dan sidecar trajectory yang lebih lama dari `session.maintenance.pruneAfter`; file yang masih dirujuk oleh `sessions.json` dipertahankan.

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat apa yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan bahkan saat `session.maintenance.mode` adalah `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun entri tersebut biasanya belum akan dikeluarkan karena umur/jumlah.
- `--active-key <key>`: lindungi kunci aktif tertentu dari pengusiran anggaran disk. Pointer percakapan eksternal yang tahan lama, seperti sesi grup dan sesi chat bercakupan thread, juga dipertahankan oleh pemeliharaan umur/jumlah/anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu penyimpanan agen yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua penyimpanan agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, output menyertakan satu ringkasan per penyimpanan.

Saat Gateway dapat dijangkau, pembersihan non-dry-run untuk penyimpanan agen yang dikonfigurasi dikirim melalui Gateway sehingga berbagi penulis penyimpanan sesi yang sama dengan traffic runtime. Gunakan `--store <path>` untuk perbaikan offline eksplisit pada file penyimpanan.

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
