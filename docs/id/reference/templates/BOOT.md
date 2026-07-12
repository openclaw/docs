---
read_when:
    - Menambahkan daftar periksa BOOT.md
summary: Templat ruang kerja untuk BOOT.md
title: Templat BOOT.md
x-i18n:
    generated_at: "2026-07-12T14:41:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

Tambahkan petunjuk awal mulai yang singkat dan eksplisit di sini. Hook bawaan `boot-md` menjalankan berkas ini satu kali per ruang kerja agen setiap kali Gateway dimulai, jika berkas tersebut ada dan memiliki konten selain spasi kosong. Beberapa agen yang berbagi ruang kerja hanya memicu satu kali eksekusi.

Hook ini dinonaktifkan secara bawaan. Aktifkan terlebih dahulu:

```bash
openclaw hooks enable boot-md
```

Jika suatu butir daftar periksa mengirim pesan, gunakan alat pesan, lalu balas dengan token senyap persis `NO_REPLY` (tidak peka huruf besar-kecil).

## Terkait

- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Hook](/id/automation/hooks#boot-md)
