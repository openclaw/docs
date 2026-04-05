---
read_when:
    - Anda ingin melihat Skills mana yang tersedia dan siap dijalankan
    - Anda ingin mencari, menginstal, atau memperbarui Skills dari ClawHub
    - Anda ingin men-debug binary/env/config yang hilang untuk Skills
summary: Referensi CLI untuk `openclaw skills` (search/install/update/list/info/check)
title: skills
x-i18n:
    generated_at: "2026-04-05T13:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

Periksa Skills lokal dan instal/perbarui Skills dari ClawHub.

Terkait:

- Sistem Skills: [Skills](/tools/skills)
- Config Skills: [Skills config](/tools/skills-config)
- Instalasi ClawHub: [ClawHub](/tools/clawhub)

## Perintah

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` menggunakan ClawHub secara langsung dan menginstal ke direktori
workspace aktif `skills/`. `list`/`info`/`check` tetap memeriksa Skills lokal
yang terlihat oleh workspace dan config saat ini.

Perintah CLI `install` ini mengunduh folder skill dari ClawHub. Instalasi dependensi skill
berbasis Gateway yang dipicu dari onboarding atau pengaturan Skills menggunakan
jalur permintaan `skills.install` yang terpisah.

Catatan:

- `search [query...]` menerima kueri opsional; hilangkan untuk menelusuri feed pencarian default
  ClawHub.
- `search --limit <n>` membatasi jumlah hasil yang dikembalikan.
- `install --force` menimpa folder skill workspace yang sudah ada untuk
  slug yang sama.
- `update --all` hanya memperbarui instalasi ClawHub yang dilacak di workspace aktif.
- `list` adalah tindakan default saat tidak ada subperintah yang diberikan.
- `list`, `info`, dan `check` menulis output yang sudah dirender ke stdout. Dengan
  `--json`, artinya payload yang dapat dibaca mesin tetap berada di stdout untuk pipe
  dan skrip.
