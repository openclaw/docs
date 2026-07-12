---
read_when:
    - Вам потрібні автодоповнення командної оболонки для zsh/bash/fish/PowerShell
    - Потрібно кешувати скрипти автодоповнення у сховищі стану OpenClaw
summary: Довідник CLI для `openclaw completion` (створення/встановлення сценаріїв автодоповнення командної оболонки)
title: Завершення
x-i18n:
    generated_at: "2026-07-12T13:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Створюйте сценарії автодоповнення для командної оболонки, кешуйте їх у стані OpenClaw і за потреби встановлюйте у профіль командної оболонки.

## Використання

```bash
openclaw completion                          # вивести сценарій zsh у stdout
openclaw completion --shell fish             # вивести сценарій fish
openclaw completion --write-state            # кешувати сценарії для всіх командних оболонок
openclaw completion --write-state --install  # кешувати, а потім установити за один крок
openclaw completion --shell bash --write-state
```

## Параметри

- `-s, --shell <shell>`: цільова командна оболонка (`zsh`, `bash`, `powershell`, `fish`; типово: `zsh`)
- `-i, --install`: установити автодоповнення, додавши до профілю командної оболонки рядок підключення кешованого сценарію
- `--write-state`: записати сценарій або сценарії автодоповнення до `$OPENCLAW_STATE_DIR/completions` (типово `~/.openclaw/completions`) без виведення у stdout; з `--shell` записується лише сценарій для вказаної оболонки, інакше — для всіх чотирьох
- `-y, --yes`: пропустити запити підтвердження встановлення (неінтерактивний режим)

## Процес встановлення

`--install` налаштовує профіль на використання кешованого сценарію, тому кеш має вже існувати: якщо його немає, команда завершується помилкою та пропонує виконати `openclaw completion --write-state`. Поєднайте `--write-state --install`, щоб виконати обидві дії за один крок. Без `--shell` параметр `--install` визначає оболонку зі змінної `$SHELL` (якщо це не вдається, використовується zsh).

Під час встановлення до профілю командної оболонки записується невеликий блок `# OpenClaw Completion`, а всі старі повільні рядки `source <(openclaw completion ...)` замінюються рядком підключення кешованого сценарію:

| Оболонка   | Профіль                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (якщо `~/.bashrc` немає, використовується `~/.bash_profile`)                                                                                                                   |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (у Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` або `Documents/WindowsPowerShell/...` для Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Примітки

- Без `--install` або `--write-state` команда виводить сценарій у stdout.
- Під час створення автодоповнення завчасно завантажується повне дерево команд, включно з CLI-командами плагінів, тому вкладені підкоманди також включаються.
- `openclaw update` автоматично оновлює кеш автодоповнення після успішного оновлення; `openclaw doctor` може виправляти відсутні або застарілі налаштування автодоповнення.

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
