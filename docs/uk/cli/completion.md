---
read_when:
    - Ви хочете автодоповнення оболонки для zsh/bash/fish/PowerShell
    - Вам потрібно кешувати скрипти автодоповнення в стані OpenClaw
summary: Довідник CLI для `openclaw completion` (генерація/встановлення скриптів автодоповнення оболонки)
title: Автодоповнення
x-i18n:
    generated_at: "2026-04-23T20:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 859450b18bee731b36f911c183c338012141ae4c58f61bf75ae905a6b8596ce1
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Генерує скрипти автодоповнення оболонки та за потреби встановлює їх у профіль вашої оболонки.

## Використання

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Параметри

- `-s, --shell <shell>`: цільова оболонка (`zsh`, `bash`, `powershell`, `fish`; типово: `zsh`)
- `-i, --install`: установити автодоповнення, додавши рядок source до профілю вашої оболонки
- `--write-state`: записати скрипт(и) автодоповнення до `$OPENCLAW_STATE_DIR/completions` без виведення в stdout
- `-y, --yes`: пропустити запити на підтвердження встановлення

## Примітки

- `--install` записує невеликий блок "OpenClaw Completion" до профілю вашої оболонки та вказує його на кешований скрипт.
- Без `--install` або `--write-state` команда виводить скрипт у stdout.
- Генерація автодоповнення завчасно завантажує дерева команд, щоб вкладені підкоманди були включені.
