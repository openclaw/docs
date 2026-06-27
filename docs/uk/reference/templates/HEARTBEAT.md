---
read_when:
    - Ініціалізація робочого простору вручну
summary: Шаблон робочого простору для HEARTBEAT.md
title: Шаблон HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:20:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Шаблон HEARTBEAT.md

`HEARTBEAT.md` розміщується в робочому просторі агента. Залиште файл порожнім або лише з Markdown-коментарями та заголовками, якщо хочете, щоб OpenClaw пропускав виклики моделі Heartbeat.

Стандартний шаблон середовища виконання:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Додавайте короткі завдання під коментарями лише тоді, коли хочете, щоб агент періодично щось перевіряв. Інструкції Heartbeat мають бути короткими, оскільки вони читаються під час повторюваних пробуджень.

## Пов’язане

- [Конфігурація Heartbeat](/uk/gateway/config-agents)
