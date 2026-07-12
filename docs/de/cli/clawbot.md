---
read_when:
    - Sie pflegen ältere Skripte mit `openclaw clawbot ...`
    - Sie benötigen eine Migrationsanleitung für die aktuellen Befehle
summary: CLI-Referenz für `openclaw clawbot` (Namespace für veraltete Aliasse)
title: Clawbot
x-i18n:
    generated_at: "2026-07-12T15:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6baf9b4e9bbe8bb31cdc4923c38cd45a883b6e5be921a403335e257dacdc2cd5
    source_path: cli/clawbot.md
    workflow: 16
---

# `openclaw clawbot`

Veralteter Alias-Namespace, der zur Abwärtskompatibilität beibehalten wird. Er registriert denselben QR-Befehl wie die übergeordnete CLI, sodass `openclaw clawbot qr` jedes Flag von [`openclaw qr`](/de/cli/qr) akzeptiert.

## Migration

Verwenden Sie vorzugsweise den modernen übergeordneten Befehl:

- `openclaw clawbot qr` -> `openclaw qr`

## Verwandte Themen

- [CLI-Referenz](/de/cli)
