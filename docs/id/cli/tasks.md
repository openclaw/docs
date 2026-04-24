---
read_when:
    - Anda ingin memeriksa, mengaudit, atau membatalkan catatan tugas latar belakang
    - Anda sedang mendokumentasikan perintah TaskFlow di bawah `openclaw tasks flow`
summary: Referensi CLI untuk `openclaw tasks` (buku besar tugas latar belakang dan status TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T09:03:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Periksa tugas latar belakang yang tahan lama dan status TaskFlow. Tanpa subperintah,
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

- `--json`: output JSON.
- `--runtime <name>`: filter berdasarkan jenis: `subagent`, `acp`, `cron`, atau `cli`.
- `--status <name>`: filter berdasarkan status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, atau `lost`.

## Subperintah

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Menampilkan daftar tugas latar belakang yang dilacak, terbaru lebih dulu.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Menampilkan satu tugas berdasarkan task ID, run ID, atau session key.

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

Menampilkan catatan tugas dan TaskFlow yang basi, hilang, gagal dikirim, atau tidak konsisten.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Menampilkan pratinjau atau menerapkan rekonsiliasi, penandaan pembersihan, dan pemangkasan tugas dan TaskFlow.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Memeriksa atau membatalkan status TaskFlow yang tahan lama di bawah buku besar tugas.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas latar belakang](/id/automation/tasks)
