---
read_when:
    - Ви хочете шукати в живій документації OpenClaw з термінала
summary: Довідник CLI для `openclaw docs` (шукати в живому індексі документації)
title: Документація
x-i18n:
    generated_at: "2026-04-23T20:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611ca0db2655734fe92b620b0ff2b822c4db9d44faf269e583ccea298e6400ca
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Шукати в живому індексі документації.

Аргументи:

- `[query...]`: пошукові терміни, які надсилаються до живого індексу документації

Приклади:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Примітки:

- Без запиту `openclaw docs` відкриває точку входу пошуку в живій документації.
- Багатослівні запити передаються як один пошуковий запит.
