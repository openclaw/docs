---
read_when:
    - Anda ingin mencantumkan sesi tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (daftar sesi tersimpan + penggunaan)
title: sessions
x-i18n:
    generated_at: "2026-04-05T13:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Mencantumkan sesi percakapan yang tersimpan.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Pemilihan cakupan:

- default: penyimpanan agen default yang dikonfigurasi
- `--verbose`: logging verbose
- `--agent <id>`: satu penyimpanan agen yang dikonfigurasi
- `--all-agents`: gabungkan semua penyimpanan agen yang dikonfigurasi
- `--store <path>`: jalur penyimpanan eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)

`openclaw sessions --all-agents` membaca penyimpanan agen yang dikonfigurasi. Gateway dan ACP
discovery sesi lebih luas: keduanya juga menyertakan penyimpanan hanya-di-disk yang ditemukan di bawah
root default `agents/` atau root `session.store` bertemplat. Penyimpanan yang
ditemukan ini harus di-resolve menjadi file `sessions.json` biasa di dalam
root agen; symlink dan jalur di luar root dilewati.

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

Jalankan pemeliharaan sekarang (alih-alih menunggu siklus penulisan berikutnya):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` menggunakan pengaturan `session.maintenance` dari config:

- Catatan cakupan: `openclaw sessions cleanup` hanya memelihara penyimpanan/transkrip sesi. Perintah ini tidak memangkas log eksekusi cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` di [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan dalam [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel aksi per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat mana yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan meskipun `session.maintenance.mode` adalah `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun entri tersebut biasanya belum melewati batas usia/jumlah.
- `--active-key <key>`: lindungi active key tertentu dari pengusiran karena anggaran disk.
- `--agent <id>`: jalankan pembersihan untuk satu penyimpanan agen yang dikonfigurasi.
- `--all-agents`: jalankan pembersihan untuk semua penyimpanan agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, output mencakup satu ringkasan per penyimpanan.

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

- Config sesi: [Referensi konfigurasi](/gateway/configuration-reference#session)
