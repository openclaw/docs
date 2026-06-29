---
read_when:
    - Вам нужны автодополнения оболочки для zsh/bash/fish/PowerShell
    - Необходимо кэшировать скрипты автодополнения в состоянии OpenClaw
summary: Справочник CLI для `openclaw completion` (создание/установка сценариев автодополнения оболочки)
title: Выполнение
x-i18n:
    generated_at: "2026-06-28T22:42:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Сгенерируйте скрипты автодополнения оболочки и при необходимости установите их в профиль вашей оболочки.

## Использование

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Параметры

- `-s, --shell <shell>`: целевая оболочка (`zsh`, `bash`, `powershell`, `fish`; по умолчанию: `zsh`)
- `-i, --install`: установить автодополнение, добавив строку подключения в профиль вашей оболочки
- `--write-state`: записать скрипт(ы) автодополнения в `$OPENCLAW_STATE_DIR/completions` без вывода в stdout
- `-y, --yes`: пропустить запросы подтверждения установки

## Примечания

- `--install` записывает небольшой блок "OpenClaw Completion" в профиль вашей оболочки и указывает его на кэшированный скрипт.
- Без `--install` или `--write-state` команда выводит скрипт в stdout.
- Генерация автодополнения заранее загружает деревья команд, чтобы включить вложенные подкоманды.

## Связанные материалы

- [Справочник CLI](/ru/cli)
