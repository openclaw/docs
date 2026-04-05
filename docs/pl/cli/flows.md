---
read_when:
    - Napotykasz openclaw flows w starszej dokumentacji lub informacjach o wydaniu
summary: 'Przekierowanie: polecenia flow znajdują się w `openclaw tasks flow`'
title: flows (przekierowanie)
x-i18n:
    generated_at: "2026-04-05T13:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4b9acefdb4e8dedde08d96986fe9b1ca7f91293281850b68ff9fa28f0516a61
    source_path: cli/flows.md
    workflow: 15
---

# `openclaw tasks flow`

Polecenia flow są podpoleceniami `openclaw tasks`, a nie osobnym poleceniem `flows`.

```bash
openclaw tasks flow list [--json]
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

Pełną dokumentację znajdziesz w [Task Flow](/pl/automation/taskflow) oraz w [dokumentacji CLI tasks](/cli/index#tasks).
