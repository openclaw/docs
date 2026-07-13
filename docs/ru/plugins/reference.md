---
read_when:
    - Вам нужна справочная страница по конкретному плагину OpenClaw
    - Вы проводите аудит полноты документации плагинов
summary: Созданный индекс справочных страниц плагинов OpenClaw
title: Справочник по плагинам
x-i18n:
    generated_at: "2026-07-13T18:32:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 9608a8e371b7c9dd26444ed56fa62d1a3785135e3cd6502d84335aee86ffa0d5
    source_path: plugins/reference.md
    workflow: 16
---

# Справочник плагинов

Эта страница создана на основе `extensions/*/package.json` и
`openclaw.plugin.json`. Чтобы создать её заново, выполните:

```bash
pnpm plugins:inventory:gen
```

Используйте [реестр плагинов](/ru/plugins/plugin-inventory), чтобы просмотреть все 139
созданных справочных страниц плагинов по дистрибутиву, пакету и описанию.
