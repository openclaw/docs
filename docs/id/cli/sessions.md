---
read_when:
    - Anda ingin menampilkan daftar sesi yang tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (mencantumkan sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-05-04T07:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Cantumkan sesi percakapan yang disimpan.

Daftar sesi bukan pemeriksaan keaktifan channel/provider. Daftar ini menampilkan baris
percakapan yang dipertahankan dari penyimpanan sesi. Discord, Slack, Telegram, atau
channel lain yang senyap dapat tersambung kembali dengan sukses tanpa membuat baris sesi
baru sampai sebuah pesan diproses. Gunakan `openclaw channels status --probe`,
`openclaw status --deep`, atau `openclaw health --verbose` saat Anda memerlukan
konektivitas channel langsung.

Respons Gateway `sessions.list` dibatasi secara bawaan agar store besar yang berumur panjang
tidak dapat memonopoli loop peristiwa Gateway. Berikan `limit` positif eksplisit
dari klien RPC saat jendela hasil yang berbeda diperlukan; respons menyertakan
`totalCount`, `limitApplied`, dan `hasMore` saat pemanggil perlu menunjukkan
bahwa ada lebih banyak baris.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Pemilihan cakupan:

- bawaan: store agen bawaan yang dikonfigurasi
- `--verbose`: pencatatan log verbose
- `--agent <id>`: satu store agen yang dikonfigurasi
- `--all-agents`: agregasikan semua store agen yang dikonfigurasi
- `--store <path>`: jalur store eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)

Ekspor bundel trajectory untuk sesi yang disimpan:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Ini adalah jalur perintah yang digunakan oleh perintah slash `/export-trajectory` setelah
pemilik menyetujui permintaan eksekusi. Direktori output selalu di-resolve
di dalam `.openclaw/trajectory-exports/` di bawah workspace yang dipilih.

`openclaw sessions --all-agents` membaca store agen yang dikonfigurasi. Penemuan sesi
Gateway dan ACP lebih luas: keduanya juga menyertakan store yang hanya ada di disk yang ditemukan di bawah
root `agents/` bawaan atau root `session.store` bertemplat. Store yang ditemukan tersebut
harus di-resolve menjadi file `sessions.json` reguler di dalam root
agen; symlink dan jalur di luar root dilewati.

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

- Catatan cakupan: `openclaw sessions cleanup` memelihara store sesi, transkrip, dan sidecar trajectory. Perintah ini tidak memangkas log eksekusi cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` dalam [konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan dalam [pemeliharaan Cron](/id/automation/cron-jobs#maintenance).

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel tindakan per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat apa yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan meskipun `session.maintenance.mode` adalah `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun biasanya entri tersebut belum keluar karena usia/jumlah.
- `--active-key <key>`: lindungi kunci aktif tertentu dari pengusiran karena anggaran disk. Pointer percakapan eksternal yang tahan lama, seperti sesi grup dan sesi chat bercakupan thread, juga dipertahankan oleh pemeliharaan usia/jumlah/anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu store agen yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua store agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, output menyertakan satu ringkasan per store.

Saat Gateway dapat dijangkau, pembersihan non-dry-run untuk store agen yang dikonfigurasi
dikirim melalui Gateway sehingga berbagi penulis store sesi yang sama dengan lalu lintas
runtime. Gunakan `--store <path>` untuk perbaikan offline eksplisit pada file store.

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
