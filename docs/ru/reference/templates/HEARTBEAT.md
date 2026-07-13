---
read_when:
    - Ручная инициализация рабочего пространства
summary: Шаблон рабочего пространства для HEARTBEAT.md
title: Шаблон HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-13T20:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Шаблон HEARTBEAT.md

`HEARTBEAT.md` находится в рабочем пространстве агента и содержит контрольный список для периодического Heartbeat. Оставьте его пустым или содержащим только пробельные символы, комментарии Markdown, заголовки ATX, пустые заготовки списков (`- `, `* [ ]`) либо маркеры блоков кода, чтобы OpenClaw полностью пропускал вызов модели для Heartbeat (`reason=empty-heartbeat-file`).

Содержимое по умолчанию в поставляемой версии:

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Оставьте этот файл пустым (или содержащим только комментарии), чтобы пропускать вызовы API для Heartbeat.

# Добавьте задачи ниже, если хотите, чтобы агент периодически что-либо проверял.
```

Добавляйте краткие задачи под строками комментариев, только если вам нужны периодические проверки. Не раздувайте файл: при каждом такте Heartbeat считывает его (по умолчанию каждые 30 минут), поэтому избыточные инструкции расходуют токены при каждом пробуждении.

Чтобы выполнять только проверки, срок которых наступил, вместо обычного контрольного списка используйте структурированный блок `tasks:` с полями `interval` и `prompt` для каждой задачи; формат и поведение описаны в разделе [HEARTBEAT.md](/ru/gateway/heartbeat#heartbeatmd-optional).

## Связанные материалы

- [Heartbeat](/ru/gateway/heartbeat)
- [Конфигурация Heartbeat](/ru/gateway/config-agents)
