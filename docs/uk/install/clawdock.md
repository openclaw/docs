---
read_when:
    - Ви часто запускаєте OpenClaw за допомогою Docker і хочете скоротити повсякденні команди
    - Вам потрібен допоміжний рівень для панелі керування, журналів, налаштування токенів і процедур сполучення
summary: Допоміжні засоби оболонки ClawDock для встановлень OpenClaw на базі Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T13:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock — це невеликий шар допоміжних shell-команд для встановлень OpenClaw на основі Docker.

Він надає короткі команди, як-от `clawdock-start`, `clawdock-dashboard` і `clawdock-fix-token`, замість довших викликів `docker compose ...`.

Якщо ви ще не налаштували Docker, почніть із розділу [Docker](/uk/install/docker).

## Встановлення

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо раніше ви встановили ClawDock із `scripts/shell-helpers/clawdock-helpers.sh`, перевстановіть його з поточного шляху `scripts/clawdock/clawdock-helpers.sh`; старий прямий шлях GitHub було видалено.

Під час першого використання допоміжні команди автоматично визначають розташування вашої робочої копії OpenClaw, перевіряючи поширені шляхи, як-от `~/openclaw` і `~/projects/openclaw`, та кешують результат у `~/.clawdock/config`. Якщо ваша робоча копія розташована в іншому місці, задайте `CLAWDOCK_DIR` самостійно.

## Що ви отримуєте

### Основні операції

| Команда            | Опис                       |
| ------------------ | -------------------------- |
| `clawdock-start`   | Запустити Gateway          |
| `clawdock-stop`    | Зупинити Gateway           |
| `clawdock-restart` | Перезапустити Gateway      |
| `clawdock-status`  | Перевірити стан контейнера |
| `clawdock-logs`    | Стежити за журналами Gateway |

### Доступ до контейнера

| Команда                   | Опис                                          |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Відкрити оболонку в контейнері Gateway        |
| `clawdock-cli <command>`  | Виконати команди CLI OpenClaw у Docker        |
| `clawdock-exec <command>` | Виконати довільну команду в контейнері        |

### Вебінтерфейс і сполучення

| Команда                 | Опис                                      |
| ----------------------- | ----------------------------------------- |
| `clawdock-dashboard`    | Відкрити URL інтерфейсу керування         |
| `clawdock-devices`      | Переглянути сполучення пристроїв в очікуванні |
| `clawdock-approve <id>` | Схвалити запит на сполучення              |

### Налаштування й обслуговування

| Команда              | Опис                                                   |
| -------------------- | ------------------------------------------------------ |
| `clawdock-fix-token` | Записати токен Gateway у конфігурацію контейнера       |
| `clawdock-update`    | Отримати зміни, перебудувати й перезапустити           |
| `clawdock-rebuild`   | Перебудувати лише образ Docker                         |
| `clawdock-clean`     | Видалити контейнери й томи                             |

### Утиліти

| Команда                | Опис                                             |
| ---------------------- | ------------------------------------------------ |
| `clawdock-health`      | Виконати перевірку працездатності Gateway        |
| `clawdock-token`       | Вивести токен Gateway                            |
| `clawdock-cd`          | Перейти до каталогу проєкту OpenClaw             |
| `clawdock-config`      | Відкрити `~/.openclaw`                           |
| `clawdock-show-config` | Вивести файли конфігурації із замаскованими значеннями |
| `clawdock-workspace`   | Відкрити каталог робочого простору               |
| `clawdock-help`        | Перелічити всі команди ClawDock                  |

## Послідовність першого запуску

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Якщо браузер повідомляє, що потрібне сполучення:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Конфігурація та секрети

ClawDock читає два окремі файли `.env` відповідно до поділу, описаного в розділі [Docker](/uk/install/docker):

- Файл `.env` проєкту поруч із `docker-compose.yml`: специфічні для Docker значення, як-от назва образу, порти та `OPENCLAW_GATEWAY_TOKEN`. Команда `clawdock-token` читає токен звідси.
- `~/.openclaw/.env` (підключений до контейнера): секрети зі змінних середовища, якими керує сам OpenClaw, разом із `openclaw.json` і `agents/<agentId>/agent/auth-profiles.json`.

Команда `clawdock-fix-token` копіює токен із файлу `.env` проєкту до значень конфігурації `gateway.remote.token` і `gateway.auth.token` у контейнері та перезапускає Gateway.

Використовуйте `clawdock-show-config`, щоб швидко переглянути `openclaw.json` і обидва файли `.env`; у виведених даних значення з `.env` маскуються.

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="docker">
    Канонічне встановлення OpenClaw у Docker.
  </Card>
  <Card title="Середовище виконання віртуальної машини Docker" href="/uk/install/docker-vm-runtime" icon="cube">
    Кероване Docker середовище виконання віртуальної машини для посиленої ізоляції.
  </Card>
  <Card title="Оновлення" href="/uk/install/updating" icon="arrow-up-right-from-square">
    Оновлення пакета OpenClaw і керованих служб.
  </Card>
</CardGroup>
