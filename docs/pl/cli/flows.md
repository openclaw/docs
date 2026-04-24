---
read_when:
    - Natrafiasz na `openclaw flows` w starszej dokumentacji lub informacjach o wydaniu
summary: 'Przekierowanie: polecenia flow znajdują się pod `openclaw tasks flow`'
title: Flows (przekierowanie)
x-i18n:
    generated_at: "2026-04-24T09:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c818ebd740a395fdbb4d68be21a29b524b45c7348c39efd4cf6eab125c86d44c
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

Pełna dokumentacja znajduje się w [TaskFlow](/pl/automation/taskflow) oraz [dokumentacji referencyjnej CLI tasks](/pl/cli/tasks).

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Automatyzacja](/pl/automation)
