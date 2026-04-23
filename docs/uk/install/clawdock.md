---
read_when:
    - Ви часто запускаєте OpenClaw з Docker і хочете коротші щоденні команди
    - Вам потрібен допоміжний шар для dashboard, логів, налаштування token і потоків pairing
summary: Shell-helper-и ClawDock для Docker-орієнтованих встановлень OpenClaw
title: ClawDock
x-i18n:
    generated_at: "2026-04-23T20:56:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock — це невеликий шар shell-helper-ів для Docker-орієнтованих встановлень OpenClaw.

Він надає короткі команди на кшталт `clawdock-start`, `clawdock-dashboard` і `clawdock-fix-token` замість довших викликів `docker compose ...`.

Якщо ви ще не налаштували Docker, почніть із [Docker](/uk/install/docker).

## Установлення

Використовуйте канонічний шлях helper-а:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви раніше встановили ClawDock з `scripts/shell-helpers/clawdock-helpers.sh`, перевстановіть його з нового шляху `scripts/clawdock/clawdock-helpers.sh`. Старий raw GitHub path було видалено.

## Що ви отримуєте

### Базові операції

| Команда            | Опис                    |
| ------------------ | ----------------------- |
| `clawdock-start`   | Запустити gateway       |
| `clawdock-stop`    | Зупинити gateway        |
| `clawdock-restart` | Перезапустити gateway   |
| `clawdock-status`  | Перевірити стан container |
| `clawdock-logs`    | Переглядати логи gateway |

### Доступ до container

| Команда                   | Опис                                          |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Відкрити shell усередині container gateway    |
| `clawdock-cli <command>`  | Запустити команди CLI OpenClaw у Docker       |
| `clawdock-exec <command>` | Виконати довільну команду в container         |

### Web UI і pairing

| Команда                 | Опис                           |
| ----------------------- | ------------------------------ |
| `clawdock-dashboard`    | Відкрити URL Control UI        |
| `clawdock-devices`      | Показати pending device pairing |
| `clawdock-approve <id>` | Схвалити запит pairing         |

### Налаштування й обслуговування

| Команда              | Опис                                             |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Налаштувати token gateway всередині container    |
| `clawdock-update`    | Завантажити зміни, перебудувати й перезапустити  |
| `clawdock-rebuild`   | Лише перебудувати Docker image                   |
| `clawdock-clean`     | Видалити containers і volumes                    |

### Утиліти

| Команда                | Опис                                    |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | Запустити перевірку стану gateway       |
| `clawdock-token`       | Вивести token gateway                   |
| `clawdock-cd`          | Перейти до каталогу проєкту OpenClaw    |
| `clawdock-config`      | Відкрити `~/.openclaw`                  |
| `clawdock-show-config` | Вивести файли конфігурації з редагованими значеннями |
| `clawdock-workspace`   | Відкрити каталог робочого простору      |

## Перший запуск

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Якщо браузер повідомляє, що потрібен pairing:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Конфігурація та секрети

ClawDock працює з тим самим поділом конфігурації Docker, який описано в [Docker](/uk/install/docker):

- `<project>/.env` для значень, специфічних для Docker, як-от назва image, порти й token gateway
- `~/.openclaw/.env` для ключів provider-ів і bot tokens, прив’язаних до env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` для збереженої автентифікації provider-а через OAuth/API-key
- `~/.openclaw/openclaw.json` для конфігурації поведінки

Використовуйте `clawdock-show-config`, коли хочете швидко перевірити файли `.env` і `openclaw.json`. У надрукованому виводі значення `.env` редагуються.

## Пов’язані сторінки

- [Docker](/uk/install/docker)
- [Docker VM Runtime](/uk/install/docker-vm-runtime)
- [Updating](/uk/install/updating)
