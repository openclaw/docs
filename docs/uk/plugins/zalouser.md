---
read_when:
    - Ви хочете додати підтримку Zalo Personal (неофіційну) в OpenClaw
    - Ви налаштовуєте або розробляєте плагін zalouser
summary: 'Plugin Zalo Personal: вхід за QR-кодом і обмін повідомленнями через нативний zca-js (встановлення плагіна + налаштування каналу + інструмент)'
title: Plugin особистого облікового запису Zalo
x-i18n:
    generated_at: "2026-07-12T13:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Підтримка Zalo Personal для OpenClaw через Plugin, що використовує нативний `zca-js` для
автоматизації звичайного облікового запису користувача Zalo. Зовнішній виконуваний файл CLI
`zca`/`openzca` не потрібен.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Найменування

Ідентифікатор каналу — `zalouser`, щоб чітко вказати, що він автоматизує **особистий
обліковий запис користувача Zalo** (неофіційно). Окремий ідентифікатор каналу `zalo` призначений для офіційної
вбудованої інтеграції Zalo Bot/Webhook — див. [Zalo](/uk/channels/zalo).

## Де він працює

Цей Plugin працює **всередині процесу Gateway**. Для віддаленого Gateway
встановіть і налаштуйте його на відповідному хості, а потім перезапустіть Gateway.

## Встановлення

### З npm

```bash
openclaw plugins install @openclaw/zalouser
```

Використовуйте пакет без зазначення версії, щоб отримувати поточний офіційний тег випуску; закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення. Після цього перезапустіть
Gateway.

### З локальної папки (розробка)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Конфігурація каналу міститься в `channels.zalouser` (а не в `plugins.entries.*`):

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

Відомості про керування доступом до особистих повідомлень і груп, налаштування кількох облікових записів,
змінні середовища та усунення несправностей див. у розділі [Конфігурація особистого каналу Zalo](/uk/channels/zalouser).

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Інструмент агента

Назва інструмента: `zalouser`

Дії: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Дії з повідомленнями каналу (не інструмент агента) також підтримують `react` для
реакцій на повідомлення.

## Пов’язані матеріали

- [Конфігурація особистого каналу Zalo](/uk/channels/zalouser)
- [Zalo (офіційний канал Bot/Webhook)](/uk/channels/zalo)
- [Створення плагінів](/uk/plugins/building-plugins)
- [ClawHub](/clawhub)
