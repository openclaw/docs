---
read_when:
    - Anda ingin memeriksa komitmen tindak lanjut yang disimpulkan
    - Anda ingin mengabaikan check-in yang tertunda
    - Anda sedang mengaudit apa yang dapat dikirimkan oleh Heartbeat
summary: Referensi CLI untuk `openclaw commitments` (periksa dan abaikan tindak lanjut yang disimpulkan)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T09:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Cantumkan dan kelola komitmen tindak lanjut yang diinferensi.

Komitmen bersifat opt-in, berupa memori tindak lanjut berumur pendek yang dibuat dari
konteks percakapan. Lihat [Komitmen yang diinferensi](/id/concepts/commitments) untuk
panduan konseptual.

Tanpa subperintah, `openclaw commitments` mencantumkan komitmen tertunda.

## Penggunaan

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opsi

- `--all`: tampilkan semua status alih-alih hanya komitmen tertunda.
- `--agent <id>`: filter ke satu id agen.
- `--status <status>`: filter menurut status. Nilai: `pending`, `sent`,
  `dismissed`, `snoozed`, atau `expired`.
- `--json`: keluarkan JSON yang dapat dibaca mesin.

## Contoh

Cantumkan komitmen tertunda:

```bash
openclaw commitments
```

Cantumkan setiap komitmen yang tersimpan:

```bash
openclaw commitments --all
```

Filter ke satu agen:

```bash
openclaw commitments --agent main
```

Temukan komitmen yang ditunda:

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

Keluaran teks mencakup:

- id komitmen
- status
- jenis
- waktu jatuh tempo paling awal
- cakupan
- teks check-in yang disarankan

Keluaran JSON juga mencakup jalur penyimpanan komitmen dan rekaman tersimpan lengkap.

## Terkait

- [Komitmen yang diinferensi](/id/concepts/commitments)
- [Ikhtisar memori](/id/concepts/memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
