---
read_when:
    - Anda ingin melihat Skills mana yang tersedia dan siap dijalankan
    - Anda ingin mencari, menginstal, atau memperbarui Skills dari ClawHub
    - Anda ingin men-debug binary/env/konfigurasi yang hilang untuk Skills
summary: Referensi CLI untuk `openclaw skills` (cari/instal/perbarui/daftar/info/periksa)
title: Skills
x-i18n:
    generated_at: "2026-04-24T09:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
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

`search`/`install`/`update` menggunakan ClawHub secara langsung dan menginstal ke direktori `skills/`
workspace aktif. `list`/`info`/`check` tetap memeriksa Skills lokal
yang terlihat oleh workspace dan konfigurasi saat ini.

Perintah CLI `install` ini mengunduh folder skill dari ClawHub. Instalasi dependensi skill
berbasis Gateway yang dipicu dari onboarding atau pengaturan Skills menggunakan
jalur permintaan `skills.install` yang terpisah.

Catatan:

- `search [query...]` menerima kueri opsional; kosongkan untuk menelusuri feed pencarian default
  ClawHub.
- `search --limit <n>` membatasi hasil yang dikembalikan.
- `install --force` menimpa folder skill workspace yang sudah ada untuk
  slug yang sama.
- `update --all` hanya memperbarui instalasi ClawHub yang dilacak di workspace aktif.
- `list` adalah aksi default ketika tidak ada subperintah yang diberikan.
- `list`, `info`, dan `check` menulis output yang telah dirender ke stdout. Dengan
  `--json`, payload yang dapat dibaca mesin tetap berada di stdout untuk pipe
  dan skrip.

## Terkait

- [Referensi CLI](/id/cli)
- [Skills](/id/tools/skills)
