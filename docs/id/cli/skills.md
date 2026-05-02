---
read_when:
    - Anda ingin melihat Skills apa saja yang tersedia dan siap dijalankan
    - Anda ingin mencari, menginstal, atau memperbarui Skills dari ClawHub
    - Anda ingin men-debug biner/env/konfigurasi yang hilang untuk Skills
summary: Referensi CLI untuk `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` menggunakan ClawHub secara langsung dan menginstal ke direktori `skills/` ruang kerja aktif. `list`/`info`/`check` tetap memeriksa Skills lokal yang terlihat oleh ruang kerja dan konfigurasi saat ini. Perintah yang didukung ruang kerja menyelesaikan ruang kerja target dari `--agent <id>`, lalu direktori kerja saat ini ketika berada di dalam ruang kerja agen yang dikonfigurasi, lalu agen default.

Perintah CLI `install` ini mengunduh folder skill dari ClawHub. Instalasi dependensi skill yang didukung Gateway dan dipicu dari orientasi awal atau pengaturan Skills menggunakan jalur permintaan `skills.install` yang terpisah.

Catatan:

- `search [query...]` menerima kueri opsional; abaikan untuk menjelajahi feed pencarian ClawHub default.
- `search --limit <n>` membatasi hasil yang dikembalikan.
- `install --force` menimpa folder skill ruang kerja yang ada untuk slug yang sama.
- `--agent <id>` menargetkan satu ruang kerja agen yang dikonfigurasi dan mengesampingkan inferensi direktori kerja saat ini.
- `update --all` hanya memperbarui instalasi ClawHub terlacak di ruang kerja aktif.
- `check --agent <id>` memeriksa ruang kerja agen yang dipilih dan melaporkan Skills siap pakai mana yang benar-benar terlihat oleh prompt atau permukaan perintah agen tersebut.
- `list` adalah tindakan default ketika tidak ada subperintah yang diberikan.
- `list`, `info`, dan `check` menulis output yang dirender ke stdout. Dengan `--json`, itu berarti payload yang dapat dibaca mesin tetap berada di stdout untuk pipe dan skrip.

## Terkait

- [Referensi CLI](/id/cli)
- [Skills](/id/tools/skills)
