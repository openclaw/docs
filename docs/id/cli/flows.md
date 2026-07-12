---
read_when:
    - Anda menemukan `openclaw flows` dalam dokumentasi lama atau catatan rilis
    - Anda menginginkan referensi pemeriksaan cepat TaskFlow
summary: 'Pengalihan: perintah alur berada di bawah `openclaw tasks flow`'
title: Alur (pengalihan)
x-i18n:
    generated_at: "2026-07-12T14:01:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Tidak ada perintah tingkat teratas `openclaw flows`. Pemeriksaan TaskFlow persisten tersedia di bawah `openclaw tasks flow`.

## Subperintah

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subperintah | Deskripsi                     | Argumen / opsi                                                                                      |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `list`      | Mencantumkan TaskFlow terlacak. | Keluaran yang dapat dibaca mesin dengan `--json`; filter `--status <name>` (lihat nilai status di bawah). |
| `show`      | Menampilkan satu TaskFlow.    | ID alur atau kunci pemilik `<lookup>`; keluaran yang dapat dibaca mesin dengan `--json`.            |
| `cancel`    | Membatalkan TaskFlow yang berjalan. | ID alur atau kunci pemilik `<lookup>`.                                                         |

`<lookup>` menerima ID alur (yang dikembalikan oleh `list` / `show`) atau kunci pemilik alur (pengidentifikasi stabil yang digunakan subsistem pemilik untuk melacak alur).

### Nilai filter status

`--status` pada `list` menerima salah satu dari: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Contoh

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Untuk konsep dan penulisan TaskFlow, lihat [TaskFlow](/id/automation/taskflow). Untuk perintah induk `tasks`, lihat [referensi CLI tasks](/id/cli/tasks).

## Terkait

- [Referensi CLI](/id/cli)
- [Otomatisasi](/id/automation)
- [TaskFlow](/id/automation/taskflow)
