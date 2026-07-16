---
read_when:
    - Anda ingin memeriksa komitmen tindak lanjut yang disimpulkan
    - Anda ingin menutup check-in yang tertunda
    - Anda sedang mengaudit apa yang mungkin dikirimkan oleh Heartbeat
summary: Referensi CLI untuk `openclaw commitments` (periksa dan abaikan tindak lanjut yang disimpulkan)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T17:53:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Mencantumkan dan mengelola komitmen tindak lanjut yang disimpulkan.

Komitmen bersifat opt-in (`commitments.enabled`), yaitu memori tindak lanjut berumur pendek
yang dibuat dari konteks percakapan dan disampaikan melalui heartbeat. Lihat
[Komitmen yang disimpulkan](/id/concepts/commitments) untuk panduan konseptual dan konfigurasi.

Tanpa subperintah, `openclaw commitments` mencantumkan komitmen yang tertunda.

## Penggunaan

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opsi

- `--all`: tampilkan semua status, bukan hanya komitmen yang tertunda.
- `--agent <id>`: filter berdasarkan satu id agen.
- `--status <status>`: filter berdasarkan status. Nilai: `pending`, `sent`,
  `dismissed`, `snoozed`, atau `expired`. Nilai yang tidak dikenal menyebabkan proses keluar dengan kesalahan.
- `--json`: keluarkan JSON yang dapat dibaca mesin.

`dismiss` menandai id komitmen yang diberikan sebagai `dismissed` agar heartbeat tidak
menyampaikannya.

## Contoh

Cantumkan komitmen yang tertunda:

```bash
openclaw commitments
```

Cantumkan setiap komitmen yang tersimpan:

```bash
openclaw commitments --all
```

Filter berdasarkan satu agen:

```bash
openclaw commitments --agent main
```

Temukan komitmen yang ditunda sementara:

```bash
openclaw commitments --status snoozed
```

Abaikan satu atau beberapa komitmen:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Ekspor sebagai JSON:

```bash
openclaw commitments --all --json
```

## Keluaran

Keluaran teks mencetak jumlah komitmen, jalur basis data SQLite bersama, semua filter aktif,
dan satu baris per komitmen:

- id komitmen
- status
- jenis (`event_check_in`, `deadline_check`, `care_check_in`, atau `open_loop`)
- waktu jatuh tempo paling awal
- cakupan (agen/saluran/target)
- teks tindak lanjut yang disarankan

Keluaran JSON menyertakan jumlah, filter status dan agen yang aktif, jalur
basis data SQLite bersama, serta rekaman tersimpan lengkap.

## Terkait

- [Komitmen yang disimpulkan](/id/concepts/commitments)
- [Ikhtisar memori](/id/concepts/memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
