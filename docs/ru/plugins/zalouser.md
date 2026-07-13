---
read_when:
    - Вам нужна поддержка Zalo Personal (неофициальная) в OpenClaw
    - Вы настраиваете или разрабатываете плагин zalouser
summary: 'Плагин Zalo Personal: вход по QR-коду и обмен сообщениями через нативный zca-js (установка плагина, настройка канала и инструмент)'
title: Персональный плагин Zalo
x-i18n:
    generated_at: "2026-07-13T18:38:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Поддержка Zalo Personal для OpenClaw через плагин, который использует нативный `zca-js` для
автоматизации обычной учётной записи пользователя Zalo. Внешний исполняемый файл CLI `zca`/`openzca`
не требуется.

<Warning>
Неофициальная автоматизация может привести к приостановке или блокировке учётной записи. Используйте на свой риск.
</Warning>

## Именование

Идентификатор канала — `zalouser`, чтобы явно указать, что он автоматизирует **личную
учётную запись пользователя Zalo** (неофициально). Отдельный идентификатор канала `zalo` относится к официальной
встроенной интеграции с ботом Zalo/Webhook — см. [Zalo](/ru/channels/zalo).

## Где он работает

Этот плагин работает **внутри процесса Gateway**. Если Gateway удалённый,
установите и настройте плагин на этом хосте, затем перезапустите Gateway.

## Установка

### Из npm

```bash
openclaw plugins install @openclaw/zalouser
```

Используйте пакет без указания версии, чтобы получать текущий официальный тег выпуска; закрепляйте точную
версию только тогда, когда требуется воспроизводимая установка. После этого перезапустите
Gateway.

### Из локальной папки (для разработки)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

После этого перезапустите Gateway.

## Конфигурация

Конфигурация канала находится в `channels.zalouser` (не в `plugins.entries.*`):

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

Сведения об управлении доступом к личным сообщениям и группам, настройке нескольких учётных записей,
переменных окружения и устранении неполадок см. в разделе [Конфигурация личного канала Zalo](/ru/channels/zalouser).

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Привет от OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "имя"
openclaw directory groups list --channel zalouser --query "имя"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Инструмент агента

Имя инструмента: `zalouser`

Действия: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Действия с сообщениями канала (не инструмент агента) также поддерживают `react` для
реакций на сообщения.

## Связанные материалы

- [Конфигурация личного канала Zalo](/ru/channels/zalouser)
- [Zalo (официальный канал бота/Webhook)](/ru/channels/zalo)
- [Создание плагинов](/ru/plugins/building-plugins)
- [ClawHub](/clawhub)
