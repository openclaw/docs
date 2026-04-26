---
read_when:
    - Anda ingin memeriksa, mengaudit, atau membatalkan catatan tugas latar belakang
    - Anda sedang mendokumentasikan perintah Task Flow di bawah `openclaw tasks flow`
summary: Referensi CLI untuk `openclaw tasks` (ledger tugas latar belakang dan status Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Periksa tugas latar belakang yang tahan lama dan status Task Flow. Tanpa subperintah,
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

- `--json`: keluarkan JSON.
- `--runtime <name>`: filter berdasarkan jenis: `subagent`, `acp`, `cron`, atau `cli`.
- `--status <name>`: filter berdasarkan status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, atau `lost`.

## Subperintah

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Mencantumkan tugas latar belakang yang dilacak, dari yang terbaru lebih dulu.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Menampilkan satu tugas berdasarkan ID tugas, ID run, atau key sesi.

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

Menampilkan catatan tugas dan Task Flow yang stale, lost, gagal dikirim, atau tidak konsisten. Tugas lost yang dipertahankan hingga `cleanupAfter` adalah peringatan; tugas lost yang kedaluwarsa atau tidak memiliki stempel adalah error.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Mempratinjau atau menerapkan rekonsiliasi tugas dan Task Flow, stamping cleanup, dan pruning.
Untuk tugas cron, rekonsiliasi menggunakan log run/status job yang persisten sebelum menandai
tugas aktif lama sebagai `lost`, sehingga run cron yang telah selesai tidak menjadi error audit palsu
hanya karena status runtime Gateway dalam memori sudah hilang. Audit CLI offline
bukan sumber otoritatif untuk kumpulan active-job cron lokal-proses milik Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Memeriksa atau membatalkan status Task Flow yang tahan lama di bawah ledger tugas.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas latar belakang](/id/automation/tasks)
