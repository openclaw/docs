---
read_when:
    - Anda ingin mencantumkan sesi tersimpan dan melihat aktivitas terbaru
summary: Referensi CLI untuk `openclaw sessions` (daftar sesi tersimpan + penggunaan)
title: Sesi
x-i18n:
    generated_at: "2026-04-24T09:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Cantumkan sesi percakapan yang tersimpan.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Pemilihan cakupan:

- default: store agen default yang dikonfigurasi
- `--verbose`: logging verbose
- `--agent <id>`: satu store agen yang dikonfigurasi
- `--all-agents`: agregasikan semua store agen yang dikonfigurasi
- `--store <path>`: path store eksplisit (tidak dapat digabungkan dengan `--agent` atau `--all-agents`)

`openclaw sessions --all-agents` membaca store agen yang dikonfigurasi. Penemuan sesi Gateway dan ACP
lebih luas: keduanya juga mencakup store khusus disk yang ditemukan di bawah
root `agents/` default atau root `session.store` bertemplate. Store yang
ditemukan ini harus me-resolve ke file `sessions.json` reguler di dalam
root agen; symlink dan path di luar root akan dilewati.

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

## Pemeliharaan cleanup

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

- Catatan cakupan: `openclaw sessions cleanup` hanya memelihara store/transkrip sesi. Perintah ini tidak memangkas log eksekusi Cron (`cron/runs/<jobId>.jsonl`), yang dikelola oleh `cron.runLog.maxBytes` dan `cron.runLog.keepLines` dalam [Konfigurasi Cron](/id/automation/cron-jobs#configuration) dan dijelaskan di [Pemeliharaan Cron](/id/automation/cron-jobs#maintenance).

- `--dry-run`: pratinjau berapa banyak entri yang akan dipangkas/dibatasi tanpa menulis.
  - Dalam mode teks, dry-run mencetak tabel aksi per sesi (`Action`, `Key`, `Age`, `Model`, `Flags`) sehingga Anda dapat melihat mana yang akan dipertahankan vs dihapus.
- `--enforce`: terapkan pemeliharaan bahkan saat `session.maintenance.mode` bernilai `warn`.
- `--fix-missing`: hapus entri yang file transkripnya hilang, meskipun biasanya belum melewati batas usia/jumlah.
- `--active-key <key>`: lindungi active key tertentu dari pengusiran karena anggaran disk.
- `--agent <id>`: jalankan cleanup untuk satu store agen yang dikonfigurasi.
- `--all-agents`: jalankan cleanup untuk semua store agen yang dikonfigurasi.
- `--store <path>`: jalankan terhadap file `sessions.json` tertentu.
- `--json`: cetak ringkasan JSON. Dengan `--all-agents`, output mencakup satu ringkasan per store.

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
