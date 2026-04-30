---
read_when:
    - Anda ingin melihat Skills mana yang tersedia dan siap dijalankan
    - Anda ingin mencari, menginstal, atau memperbarui Skills dari ClawHub
    - Anda ingin men-debug biner/env/config yang hilang untuk Skills
summary: Referensi CLI untuk `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:41:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Periksa Skills lokal dan instal/perbarui Skills dari ClawHub.

Terkait:

- Sistem Skills: [Skills](/id/tools/skills)
- Konfigurasi Skills: [Konfigurasi Skills](/id/tools/skills-config)
- Instalasi ClawHub: [ClawHub](/id/tools/clawhub)

## Perintah

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` menggunakan ClawHub secara langsung dan menginstal ke direktori `skills/` ruang kerja aktif. `list`/`info`/`check` tetap memeriksa Skills lokal yang terlihat oleh ruang kerja dan konfigurasi saat ini. Perintah yang didukung ruang kerja menyelesaikan ruang kerja target dari `--agent <id>`, lalu direktori kerja saat ini ketika berada di dalam ruang kerja agen yang dikonfigurasi, lalu agen default.

Perintah CLI `install` ini mengunduh folder Skills dari ClawHub. Instalasi dependensi Skills yang didukung Gateway dan dipicu dari onboarding atau pengaturan Skills menggunakan jalur permintaan `skills.install` yang terpisah.

Catatan:

- `search [query...]` menerima kueri opsional; hilangkan untuk menjelajahi umpan pencarian ClawHub default.
- `search --limit <n>` membatasi hasil yang dikembalikan.
- `install --force` menimpa folder Skills ruang kerja yang sudah ada untuk slug yang sama.
- `--agent <id>` menargetkan satu ruang kerja agen yang dikonfigurasi dan menggantikan inferensi direktori kerja saat ini.
- `update --all` hanya memperbarui instalasi ClawHub terlacak di ruang kerja aktif.
- `list` adalah tindakan default ketika tidak ada subperintah yang diberikan.
- `list`, `info`, dan `check` menulis output yang dirender ke stdout. Dengan `--json`, itu berarti payload yang dapat dibaca mesin tetap berada di stdout untuk pipe dan skrip.

## Terkait

- [Referensi CLI](/id/cli)
- [Skills](/id/tools/skills)
