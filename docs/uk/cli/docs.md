---
read_when:
    - Ви хочете шукати в live-документації OpenClaw з термінала
summary: Довідник CLI для `openclaw docs` (пошук у live-індексі документації)
title: документація
x-i18n:
    generated_at: "2026-04-23T06:17:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Пошук у live-індексі документації.

Аргументи:

- `[query...]`: пошукові терміни для надсилання до live-індексу документації

Приклади:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Примітки:

- Без запиту `openclaw docs` відкриває точку входу пошуку в live-документації.
- Багатослівні запити передаються як один пошуковий запит.
