---
read_when:
    - Вам потрібне автодоповнення оболонки для zsh/bash/fish/PowerShell
    - Вам потрібно кешувати скрипти автодоповнення в стані OpenClaw
summary: Довідка CLI для `openclaw completion` (створення/встановлення скриптів автодоповнення оболонки)
title: completion
x-i18n:
    generated_at: "2026-04-23T06:17:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Створює скрипти автодоповнення оболонки та, за потреби, встановлює їх у профіль вашої оболонки.

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
- `-i, --install`: встановити автодоповнення, додавши рядок source до профілю вашої оболонки
- `--write-state`: записати скрипт(и) автодоповнення до `$OPENCLAW_STATE_DIR/completions` без виведення в stdout
- `-y, --yes`: пропустити запити на підтвердження встановлення

## Примітки

- `--install` записує невеликий блок «OpenClaw Completion» до профілю вашої оболонки та спрямовує його на кешований скрипт.
- Без `--install` або `--write-state` команда виводить скрипт у stdout.
- Створення автодоповнення завчасно завантажує дерева команд, щоб вкладені підкоманди було включено.
