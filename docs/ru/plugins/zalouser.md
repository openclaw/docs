---
read_when:
    - Вам нужна поддержка Zalo Personal (неофициальная) в OpenClaw
    - Вы настраиваете или разрабатываете plugin zalouser
summary: 'Plugin Zalo Personal: вход по QR-коду + обмен сообщениями через нативный zca-js (установка Plugin + конфигурация канала + инструмент)'
title: Персональный Plugin Zalo
x-i18n:
    generated_at: "2026-06-28T23:33:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

Поддержка Zalo Personal для OpenClaw через Plugin с использованием нативного `zca-js` для автоматизации обычной учетной записи пользователя Zalo.

<Warning>
Неофициальная автоматизация может привести к приостановке действия учетной записи или блокировке. Используйте на свой риск.
</Warning>

## Именование

Идентификатор канала — `zalouser`, чтобы явно указать, что он автоматизирует **личную учетную запись пользователя Zalo** (неофициально). Мы оставляем `zalo` зарезервированным для возможной будущей официальной интеграции с API Zalo.

## Где он запускается

Этот Plugin запускается **внутри процесса Gateway**.

Если вы используете удаленный Gateway, установите и настройте его на **машине, где запущен Gateway**, затем перезапустите Gateway.

Внешний CLI-бинарник `zca`/`openzca` не требуется.

## Установка

### Вариант A: установка из npm

```bash
openclaw plugins install @openclaw/zalouser
```

Используйте пакет без указания версии, чтобы следовать текущему официальному релизному тегу. Закрепляйте точную
версию только тогда, когда вам нужна воспроизводимая установка.

После этого перезапустите Gateway.

### Вариант B: установка из локальной папки (разработка)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

После этого перезапустите Gateway.

## Конфигурация

Конфигурация канала находится в `channels.zalouser` (а не в `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Инструмент агента

Имя инструмента: `zalouser`

Действия: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Действия сообщений канала также поддерживают `react` для реакций на сообщения.

## Связанное

- [Создание Plugin](/ru/plugins/building-plugins)
- [ClawHub](/ru/clawhub)
