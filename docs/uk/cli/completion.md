---
read_when:
    - Вам потрібне автодоповнення оболонки для zsh/bash/fish/PowerShell
    - Вам потрібно кешувати скрипти автодоповнення в стані OpenClaw
summary: Довідка CLI для `openclaw completion` (згенерувати/встановити скрипти автодоповнення оболонки)
title: Автодоповнення
x-i18n:
    generated_at: "2026-04-24T04:11:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw completion`

Згенеруйте скрипти автодоповнення оболонки та, за бажання, встановіть їх у профіль вашої оболонки.

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

- `--install` записує невеликий блок "Автодоповнення OpenClaw" у профіль вашої оболонки та вказує його на кешований скрипт.
- Без `--install` або `--write-state` команда виводить скрипт у stdout.
- Генерація автодоповнення завчасно завантажує дерева команд, щоб були включені вкладені підкоманди.

## Пов’язане

- [Довідка CLI](/uk/cli)
