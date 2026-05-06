---
read_when:
    - Ви часто запускаєте OpenClaw за допомогою Docker і хочете коротші щоденні команди
    - Вам потрібен допоміжний шар для панелі керування, журналів, налаштування токена та процесів сполучення
summary: Допоміжні shell-засоби ClawDock для встановлень OpenClaw на основі Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T02:05:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock — це невеликий шар shell-помічників для встановлень OpenClaw на основі Docker.

Він дає короткі команди на кшталт `clawdock-start`, `clawdock-dashboard` і `clawdock-fix-token` замість довших викликів `docker compose ...`.

Якщо ви ще не налаштували Docker, почніть із [Docker](/uk/install/docker).

## Встановлення

Використовуйте канонічний шлях помічника:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо раніше ви встановили ClawDock із `scripts/shell-helpers/clawdock-helpers.sh`, перевстановіть його з нового шляху `scripts/clawdock/clawdock-helpers.sh`. Старий raw-шлях GitHub було вилучено.

## Що ви отримуєте

### Базові операції

| Команда            | Опис            |
| ------------------ | ---------------------- |
| `clawdock-start`   | Запустити Gateway      |
| `clawdock-stop`    | Зупинити Gateway       |
| `clawdock-restart` | Перезапустити Gateway    |
| `clawdock-status`  | Перевірити стан контейнера |
| `clawdock-logs`    | Стежити за журналами Gateway    |

### Доступ до контейнера

| Команда                   | Опис                                   |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Відкрити оболонку всередині контейнера Gateway     |
| `clawdock-cli <command>`  | Запускати команди OpenClaw CLI в Docker           |
| `clawdock-exec <command>` | Виконати довільну команду в контейнері |

### Веб-інтерфейс і сполучення

| Команда                 | Опис                  |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | Відкрити URL Control UI      |
| `clawdock-devices`      | Показати список очікуваних сполучень пристроїв |
| `clawdock-approve <id>` | Схвалити запит на сполучення    |

### Налаштування й обслуговування

| Команда              | Опис                                      |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Налаштувати токен Gateway усередині контейнера |
| `clawdock-update`    | Завантажити, перебудувати й перезапустити                       |
| `clawdock-rebuild`   | Лише перебудувати образ Docker                    |
| `clawdock-clean`     | Видалити контейнери й томи                    |

### Утиліти

| Команда                | Опис                             |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | Запустити перевірку стану Gateway              |
| `clawdock-token`       | Вивести токен Gateway                 |
| `clawdock-cd`          | Перейти до каталогу проєкту OpenClaw  |
| `clawdock-config`      | Відкрити `~/.openclaw`                      |
| `clawdock-show-config` | Вивести файли конфігурації з редагованими значеннями |
| `clawdock-workspace`   | Відкрити каталог робочого простору            |

## Потік першого запуску

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

ClawDock працює з тим самим поділом конфігурації Docker, описаним у [Docker](/uk/install/docker):

- `<project>/.env` для специфічних для Docker значень, як-от назва образу, порти й токен Gateway
- `~/.openclaw/.env` для ключів провайдерів і токенів ботів, що надходять з env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдерів
- `~/.openclaw/openclaw.json` для конфігурації поведінки

Використовуйте `clawdock-show-config`, коли хочете швидко переглянути файли `.env` і `openclaw.json`. У виведеному тексті він редагує значення `.env`.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="docker">
    Канонічне встановлення Docker для OpenClaw.
  </Card>
  <Card title="Середовище виконання Docker VM" href="/uk/install/docker-vm-runtime" icon="cube">
    Кероване Docker середовище виконання VM для посиленої ізоляції.
  </Card>
  <Card title="Оновлення" href="/uk/install/updating" icon="arrow-up-right-from-square">
    Оновлення пакета OpenClaw і керованих служб.
  </Card>
</CardGroup>
