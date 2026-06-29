---
read_when:
    - Ручная начальная настройка рабочей области
summary: Шаблон рабочей области для HEARTBEAT.md
title: Шаблон HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-28T23:45:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Шаблон HEARTBEAT.md

`HEARTBEAT.md` находится в рабочей области агента. Оставьте файл пустым или содержащим только Markdown-комментарии и заголовки, если хотите, чтобы OpenClaw пропускал вызовы модели Heartbeat.

Шаблон среды выполнения по умолчанию:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

Добавляйте короткие задачи под комментариями только тогда, когда хотите, чтобы агент периодически что-то проверял. Делайте инструкции Heartbeat краткими, потому что они читаются при повторяющихся пробуждениях.

## См. также

- [Конфигурация Heartbeat](/ru/gateway/config-agents)
