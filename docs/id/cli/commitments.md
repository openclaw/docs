---
read_when:
    - Anda ingin memeriksa komitmen tindak lanjut yang disimpulkan
    - Anda ingin mengabaikan check-in yang tertunda
    - Anda sedang mengaudit apa yang mungkin dikirimkan oleh Heartbeat
summary: Referensi CLI untuk `openclaw commitments` (periksa dan abaikan tindak lanjut yang disimpulkan)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T14:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Mencantumkan dan mengelola komitmen tindak lanjut yang disimpulkan.

Komitmen bersifat opsional (`commitments.enabled`), berupa memori tindak lanjut berumur pendek
yang dibuat dari konteks percakapan dan disampaikan melalui Heartbeat. Lihat
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
- `--agent <id>`: filter berdasarkan satu ID agen.
- `--status <status>`: filter berdasarkan status. Nilai: `pending`, `sent`,
  `dismissed`, `snoozed`, atau `expired`. Nilai yang tidak dikenal menyebabkan proses keluar dengan kesalahan.
- `--json`: keluarkan JSON yang dapat dibaca mesin.

`dismiss` menandai ID komitmen yang diberikan sebagai `dismissed` agar Heartbeat tidak
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

Keluaran teks mencetak jumlah komitmen, jalur penyimpanan, semua filter aktif,
dan satu baris per komitmen:

- ID komitmen
- status
- jenis (`event_check_in`, `deadline_check`, `care_check_in`, atau `open_loop`)
- waktu jatuh tempo paling awal
- cakupan (agen/saluran/target)
- teks tindak lanjut yang disarankan

Keluaran JSON mencakup jumlah, filter status dan agen yang aktif, jalur
penyimpanan komitmen, serta rekaman tersimpan lengkap.

## Terkait

- [Komitmen yang disimpulkan](/id/concepts/commitments)
- [Ikhtisar memori](/id/concepts/memory)
- [Heartbeat](/id/gateway/heartbeat)
- [Tugas terjadwal](/id/automation/cron-jobs)
