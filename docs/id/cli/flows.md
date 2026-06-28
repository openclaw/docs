---
read_when:
    - Anda menemukan `openclaw flows` dalam dokumentasi lama atau catatan rilis
    - Anda menginginkan referensi cepat untuk inspeksi TaskFlow
summary: 'Pengalihan: perintah flow berada di bawah `openclaw tasks flow`'
title: Alur (pengalihan)
x-i18n:
    generated_at: "2026-05-10T19:28:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

Tidak ada perintah `openclaw flows` tingkat atas. Inspeksi TaskFlow yang tahan lama berada di bawah `openclaw tasks flow`.

## Subperintah

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Subperintah | Deskripsi                | Argumen / opsi                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Mencantumkan TaskFlow yang dilacak.    | `--json` keluaran yang dapat dibaca mesin; filter `--status <name>` (lihat nilai status di bawah). |
| `show`     | Menampilkan satu TaskFlow.         | `<lookup>` ID alur atau kunci pemilik; `--json` keluaran yang dapat dibaca mesin.                    |
| `cancel`   | Membatalkan TaskFlow yang sedang berjalan. | `<lookup>` ID alur atau kunci pemilik.                                                      |

`<lookup>` menerima ID alur (yang dikembalikan oleh `list` / `show`) atau kunci pemilik alur (pengidentifikasi stabil yang digunakan subsistem pemilik untuk melacak alur).

### Nilai filter status

`--status` pada `list` menerima salah satu dari:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Contoh

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Untuk konsep TaskFlow lengkap dan penulisan, lihat [TaskFlow](/id/automation/taskflow). Untuk perintah induk `tasks`, lihat [referensi CLI tasks](/id/cli/tasks).

## Terkait

- [Referensi CLI](/id/cli)
- [Automasi](/id/automation)
- [TaskFlow](/id/automation/taskflow)
