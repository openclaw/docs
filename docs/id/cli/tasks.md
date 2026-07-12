---
read_when:
    - Anda ingin memeriksa, mengaudit, atau membatalkan catatan tugas latar belakang
    - Anda sedang mendokumentasikan perintah Task Flow di bawah `openclaw tasks flow`
summary: Referensi CLI untuk `openclaw tasks` (buku besar tugas latar belakang dan status Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T14:08:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Periksa tugas latar belakang persisten dan status Task Flow. Tanpa subperintah,
`openclaw tasks` setara dengan `openclaw tasks list`.

Lihat [Tugas Latar Belakang](/id/automation/tasks) untuk model siklus hidup dan
pengiriman, serta bagian `tasks audit` di dalamnya untuk deskripsi lengkap temuan.

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

## Opsi Utama

| Flag               | Deskripsi                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Keluarkan JSON.                                                                                    |
| `--runtime <name>` | Filter berdasarkan jenis: `subagent`, `acp`, `cron`, atau `cli`.                                   |
| `--status <name>`  | Filter berdasarkan status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, atau `lost`. |

## Subperintah

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Mencantumkan tugas latar belakang yang dilacak, mulai dari yang terbaru.

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

Menampilkan catatan tugas dan Task Flow yang kedaluwarsa, hilang, gagal dikirim,
atau tidak konsisten dengan cara lain. Tugas hilang yang dipertahankan hingga
`cleanupAfter` merupakan peringatan; tugas hilang yang telah kedaluwarsa atau
tidak memiliki stempel merupakan kesalahan.

`--code` menerima kode tugas (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) dan kode Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`, `cancel_stuck`,
`missing_linked_tasks`, `blocked_task_missing`). Lihat
[Tugas Latar Belakang](/id/automation/tasks) untuk detail tingkat keparahan dan
pemicu setiap kode.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Menampilkan pratinjau atau menerapkan rekonsiliasi tugas dan Task Flow,
pemberian stempel pembersihan, pemangkasan, serta pembersihan registri sesi
eksekusi cron yang kedaluwarsa.

Untuk tugas cron, rekonsiliasi menggunakan log eksekusi/status pekerjaan yang
dipersistenkan sebelum menandai tugas aktif lama sebagai `lost`, sehingga
eksekusi cron yang telah selesai tidak menjadi kesalahan audit palsu hanya
karena status runtime Gateway dalam memori sudah tidak ada. Audit CLI luring
bukan sumber otoritatif untuk kumpulan pekerjaan cron aktif yang bersifat lokal
pada proses Gateway. Tugas CLI dengan ID eksekusi/ID sumber ditandai `lost`
ketika konteks eksekusi Gateway aktifnya sudah tidak ada, meskipun baris sesi
turunan lama masih tersisa.

Saat diterapkan, pemeliharaan juga memangkas baris registri sesi
`cron:<jobId>:run:<uuid>` yang berusia lebih dari 7 hari, sambil mempertahankan
pekerjaan cron yang sedang berjalan dan tidak mengubah baris sesi non-cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Memeriksa atau membatalkan status Task Flow persisten di bawah buku besar tugas.
`flow list --status` menerima `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled`, atau `lost`.

## Terkait

- [Referensi CLI](/id/cli)
- [Tugas latar belakang](/id/automation/tasks)
