---
read_when:
    - Вы часто запускаете OpenClaw с помощью Docker и хотите сократить повседневные команды
    - Вам нужен вспомогательный слой для панели управления, журналов, настройки токенов и процессов сопряжения
summary: Вспомогательные команды оболочки ClawDock для установок OpenClaw на базе Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T11:28:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock — это небольшой слой вспомогательных команд оболочки для установок OpenClaw на базе Docker.

Он предоставляет короткие команды, такие как `clawdock-start`, `clawdock-dashboard` и `clawdock-fix-token`, вместо более длинных вызовов `docker compose ...`.

Если вы ещё не настроили Docker, начните с раздела [Docker](/ru/install/docker).

## Установка

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Если ранее вы устанавливали ClawDock из `scripts/shell-helpers/clawdock-helpers.sh`, переустановите его из текущего пути `scripts/clawdock/clawdock-helpers.sh`; старый прямой путь GitHub был удалён.

При первом использовании вспомогательные команды автоматически определяют расположение вашей рабочей копии OpenClaw, проверяя распространённые пути, такие как `~/openclaw` и `~/projects/openclaw`, и сохраняют результат в `~/.clawdock/config`. Если рабочая копия находится в другом месте, задайте `CLAWDOCK_DIR` самостоятельно.

## Доступные возможности

### Основные операции

| Команда            | Описание                    |
| ------------------ | --------------------------- |
| `clawdock-start`   | Запустить Gateway           |
| `clawdock-stop`    | Остановить Gateway          |
| `clawdock-restart` | Перезапустить Gateway       |
| `clawdock-status`  | Проверить состояние контейнера |
| `clawdock-logs`    | Отслеживать журналы Gateway |

### Доступ к контейнеру

| Команда                   | Описание                                         |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Открыть оболочку внутри контейнера Gateway       |
| `clawdock-cli <command>`  | Выполнить команды CLI OpenClaw в Docker          |
| `clawdock-exec <command>` | Выполнить произвольную команду в контейнере      |

### Веб-интерфейс и сопряжение

| Команда                 | Описание                                      |
| ----------------------- | --------------------------------------------- |
| `clawdock-dashboard`    | Открыть URL интерфейса управления             |
| `clawdock-devices`      | Показать ожидающие запросы на сопряжение устройств |
| `clawdock-approve <id>` | Одобрить запрос на сопряжение                 |

### Настройка и обслуживание

| Команда              | Описание                                                  |
| -------------------- | --------------------------------------------------------- |
| `clawdock-fix-token` | Записать токен Gateway в конфигурацию контейнера          |
| `clawdock-update`    | Получить изменения, пересобрать и перезапустить           |
| `clawdock-rebuild`   | Пересобрать только образ Docker                           |
| `clawdock-clean`     | Удалить контейнеры и тома                                 |

### Утилиты

| Команда                | Описание                                           |
| ---------------------- | -------------------------------------------------- |
| `clawdock-health`      | Выполнить проверку работоспособности Gateway       |
| `clawdock-token`       | Вывести токен Gateway                              |
| `clawdock-cd`          | Перейти в каталог проекта OpenClaw                 |
| `clawdock-config`      | Открыть `~/.openclaw`                              |
| `clawdock-show-config` | Вывести файлы конфигурации со скрытыми значениями  |
| `clawdock-workspace`   | Открыть каталог рабочего пространства             |
| `clawdock-help`        | Показать все команды ClawDock                      |

## Первоначальная настройка

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

ClawDock считывает два отдельных файла `.env` в соответствии с разделением, описанным в разделе [Docker](/ru/install/docker):

- Файл `.env` проекта рядом с `docker-compose.yml`: специфичные для Docker значения, такие как имя образа, порты и `OPENCLAW_GATEWAY_TOKEN`. Команда `clawdock-token` считывает токен отсюда.
- `~/.openclaw/.env` (подключённый к контейнеру): секреты на основе переменных окружения, которыми управляет сам OpenClaw, вместе с `openclaw.json` и `agents/<agentId>/agent/auth-profiles.json`.

Команда `clawdock-fix-token` копирует токен из файла `.env` проекта в значения конфигурации контейнера `gateway.remote.token` и `gateway.auth.token`, а затем перезапускает Gateway.

Используйте `clawdock-show-config`, чтобы быстро просмотреть `openclaw.json` и оба файла `.env`; в выводе команды значения из `.env` скрываются.

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Docker" href="/ru/install/docker" icon="docker">
    Канонический способ установки OpenClaw с помощью Docker.
  </Card>
  <Card title="Среда выполнения виртуальной машины Docker" href="/ru/install/docker-vm-runtime" icon="cube">
    Управляемая Docker среда выполнения виртуальной машины для усиленной изоляции.
  </Card>
  <Card title="Обновление" href="/ru/install/updating" icon="arrow-up-right-from-square">
    Обновление пакета OpenClaw и управляемых сервисов.
  </Card>
</CardGroup>
