---
read_when:
    - Вы часто запускаете OpenClaw с Docker и хотите более короткие повседневные команды
    - Вам нужен вспомогательный слой для панели управления, журналов, настройки токенов и сценариев сопряжения
summary: Вспомогательные shell-скрипты ClawDock для установок OpenClaw на базе Docker
title: ClawDock
x-i18n:
    generated_at: "2026-06-28T23:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock — это небольшой слой вспомогательных shell-команд для установок OpenClaw на базе Docker.

Он дает короткие команды вроде `clawdock-start`, `clawdock-dashboard` и `clawdock-fix-token` вместо более длинных вызовов `docker compose ...`.

Если вы еще не настроили Docker, начните с [Docker](/ru/install/docker).

## Установка

Используйте канонический путь помощника:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Если раньше вы установили ClawDock из `scripts/shell-helpers/clawdock-helpers.sh`, переустановите его из нового пути `scripts/clawdock/clawdock-helpers.sh`. Старый raw-путь GitHub был удален.

## Что вы получите

### Базовые операции

| Команда            | Описание                    |
| ------------------ | --------------------------- |
| `clawdock-start`   | Запустить шлюз              |
| `clawdock-stop`    | Остановить шлюз             |
| `clawdock-restart` | Перезапустить шлюз          |
| `clawdock-status`  | Проверить состояние контейнера |
| `clawdock-logs`    | Отслеживать логи шлюза      |

### Доступ к контейнеру

| Команда                   | Описание                                      |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Открыть shell внутри контейнера шлюза         |
| `clawdock-cli <command>`  | Выполнить команды OpenClaw CLI в Docker       |
| `clawdock-exec <command>` | Выполнить произвольную команду в контейнере   |

### Веб-интерфейс и сопряжение

| Команда                 | Описание                            |
| ----------------------- | ----------------------------------- |
| `clawdock-dashboard`    | Открыть URL Control UI              |
| `clawdock-devices`      | Показать ожидающие сопряжения устройств |
| `clawdock-approve <id>` | Одобрить запрос на сопряжение       |

### Настройка и обслуживание

| Команда              | Описание                                      |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | Настроить токен шлюза внутри контейнера       |
| `clawdock-update`    | Скачать, пересобрать и перезапустить          |
| `clawdock-rebuild`   | Только пересобрать образ Docker               |
| `clawdock-clean`     | Удалить контейнеры и тома                     |

### Утилиты

| Команда                | Описание                                  |
| ---------------------- | ----------------------------------------- |
| `clawdock-health`      | Выполнить проверку работоспособности шлюза |
| `clawdock-token`       | Вывести токен шлюза                       |
| `clawdock-cd`          | Перейти в каталог проекта OpenClaw        |
| `clawdock-config`      | Открыть `~/.openclaw`                     |
| `clawdock-show-config` | Вывести файлы конфигурации с замаскированными значениями |
| `clawdock-workspace`   | Открыть каталог рабочей области           |

## Первый запуск

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Если браузер сообщает, что требуется сопряжение:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Конфигурация и секреты

ClawDock работает с тем же разделением Docker-конфигурации, которое описано в [Docker](/ru/install/docker):

- `<project>/.env` для значений, специфичных для Docker, таких как имя образа, порты и токен шлюза
- `~/.openclaw/.env` для ключей провайдеров и токенов ботов, задаваемых через env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` для сохраненной OAuth/API-key-аутентификации провайдеров
- `~/.openclaw/openclaw.json` для конфигурации поведения

Используйте `clawdock-show-config`, когда нужно быстро просмотреть файлы `.env` и `openclaw.json`. В выводе он маскирует значения `.env`.

## См. также

<CardGroup cols={2}>
  <Card title="Docker" href="/ru/install/docker" icon="docker">
    Каноническая установка Docker для OpenClaw.
  </Card>
  <Card title="Среда выполнения Docker VM" href="/ru/install/docker-vm-runtime" icon="cube">
    Управляемая Docker среда выполнения VM для усиленной изоляции.
  </Card>
  <Card title="Обновление" href="/ru/install/updating" icon="arrow-up-right-from-square">
    Обновление пакета OpenClaw и управляемых сервисов.
  </Card>
</CardGroup>
