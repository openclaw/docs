---
read_when:
    - Menyiapkan ruang kerja secara manual
summary: Templat ruang kerja untuk HEARTBEAT.md
title: templat HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Templat HEARTBEAT.md

`HEARTBEAT.md` berada di ruang kerja agen. Biarkan file kosong, atau hanya berisi komentar dan heading Markdown, saat Anda ingin OpenClaw melewati panggilan model Heartbeat.

Templat runtime default adalah:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Tambahkan tugas singkat di bawah komentar hanya saat Anda ingin agen memeriksa sesuatu secara berkala. Jaga agar instruksi Heartbeat tetap ringkas karena instruksi tersebut dibaca selama wake berulang.

## Terkait

- [Konfigurasi Heartbeat](/id/gateway/config-agents)
