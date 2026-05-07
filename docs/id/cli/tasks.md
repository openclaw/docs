---
read_when:
    - Anda ingin memeriksa, mengaudit, atau membatalkan catatan tugas latar belakang
    - Anda sedang mendokumentasikan perintah TaskFlow di bawah `openclaw tasks flow`
summary: Referensi CLI untuk `openclaw tasks` (ledger tugas latar belakang dan status Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Periksa tugas latar belakang persisten dan status Task Flow. Tanpa subperintah,
`openclaw tasks` setara dengan `openclaw tasks list`.

Lihat [Tugas Latar Belakang](/id/automation/tasks) untuk model siklus hidup dan pengiriman.

## Penggunaan

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Opsi Root

- `--json`: hasilkan JSON.
- `--runtime <name>`: filter berdasarkan jenis: `subagent`, `acp`, `cron`, atau `cli`.
- `--status <name>`: filter berdasarkan status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, atau `lost`.

## Subperintah

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Mencantumkan tugas latar belakang yang dilacak, yang terbaru terlebih dahulu.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Menampilkan satu tugas berdasarkan ID tugas, ID eksekusi, atau kunci sesi.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Mengubah kebijakan notifikasi untuk tugas yang sedang berjalan.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Membatalkan tugas latar belakang yang sedang berjalan.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Memunculkan catatan tugas dan Task Flow yang kedaluwarsa, hilang, gagal dikirim, atau tidak konsisten. Tugas hilang yang dipertahankan hingga `cleanupAfter` adalah peringatan; tugas hilang yang kedaluwarsa atau tidak diberi stempel adalah galat.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mempratinjau atau menerapkan rekonsiliasi tugas dan Task Flow, pemberian stempel pembersihan, dan pemangkasan.
Untuk tugas cron, rekonsiliasi menggunakan log eksekusi/status pekerjaan yang dipersistenkan sebelum menandai tugas aktif lama sebagai `lost`, sehingga eksekusi cron yang selesai tidak menjadi galat audit palsu hanya karena status runtime Gateway dalam memori sudah hilang. Audit CLI offline tidak otoritatif untuk kumpulan pekerjaan aktif cron lokal-proses milik Gateway. Tugas CLI dengan ID eksekusi/ID sumber ditandai sebagai `lost` ketika konteks eksekusi Gateway live-nya hilang, meskipun baris sesi anak lama masih ada.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Memeriksa atau membatalkan status Task Flow persisten di bawah ledger tugas.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas latar belakang](/id/automation/tasks)
