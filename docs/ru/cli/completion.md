---
read_when:
    - Вам нужно автодополнение командной строки для zsh/bash/fish/PowerShell
    - Необходимо кэшировать скрипты автодополнения в каталоге состояния OpenClaw
summary: Справочник CLI для `openclaw completion` (создание и установка сценариев автодополнения командной оболочки)
title: Завершение
x-i18n:
    generated_at: "2026-07-13T17:57:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Создавайте сценарии автодополнения для оболочки, кэшируйте их в каталоге состояния OpenClaw и при необходимости устанавливайте в профиль оболочки.

## Использование

```bash
openclaw completion                          # вывести сценарий zsh в stdout
openclaw completion --shell fish             # вывести сценарий fish
openclaw completion --write-state            # кэшировать сценарии для всех оболочек
openclaw completion --write-state --install  # кэшировать, затем установить за один шаг
openclaw completion --shell bash --write-state
```

## Параметры

- `-s, --shell <shell>`: целевая оболочка (`zsh`, `bash`, `powershell`, `fish`; по умолчанию: `zsh`)
- `-i, --install`: установить автодополнение, добавив в профиль оболочки строку подключения кэшированного сценария
- `--write-state`: записать сценарии автодополнения в `$OPENCLAW_STATE_DIR/completions` (по умолчанию `~/.openclaw/completions`), не выводя их в stdout; с `--shell` записывается сценарий только для указанной оболочки, иначе — для всех четырёх
- `-y, --yes`: пропустить запросы подтверждения установки (неинтерактивный режим)

## Процесс установки

`--install` настраивает профиль на использование кэшированного сценария, поэтому кэш должен уже существовать: если он отсутствует, команда завершается с ошибкой и предлагает выполнить `openclaw completion --write-state`. Добавьте `--write-state --install`, чтобы выполнить оба действия за один шаг. Если `--shell` не указан, `--install` определяет оболочку по `$SHELL` (если это не удаётся, используется zsh).

При установке в профиль оболочки записывается небольшой блок `# OpenClaw Completion`, а все прежние медленные строки `source <(openclaw completion ...)` заменяются строкой подключения кэшированного сценария:

| Оболочка   | Профиль                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (если `~/.bashrc` отсутствует, используется `~/.bash_profile`)                                                                                                                  |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (в Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` или `Documents/WindowsPowerShell/...` для Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Примечания

- Если не указаны `--install` или `--write-state`, команда выводит сценарий в stdout.
- При создании автодополнения сразу загружается полное дерево команд, включая CLI-команды плагинов, поэтому вложенные подкоманды также включаются.
- `openclaw update` автоматически обновляет кэш автодополнения после успешного обновления; `openclaw doctor` может исправить отсутствующие или устаревшие настройки автодополнения.

## См. также

- [Справочник CLI](/ru/cli)
