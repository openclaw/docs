---
read_when:
    - Ви хочете підтримку Zalo Personal (неофіційну) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin `zalouser`
summary: 'Plugin Zalo Personal: вхід через QR + обмін повідомленнями через native `zca-js` (встановлення plugin, конфігурація каналу + інструмент)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-23T21:04:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 806618b43d1285d1e47c9419b2f4f6f77c5784035c9b7073d0c5e97485876993
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Підтримка Zalo Personal для OpenClaw через Plugin, який використовує native `zca-js` для автоматизації звичайного особистого облікового запису Zalo.

> **Warning:** Неофіційна автоматизація може призвести до призупинення/бану облікового запису. Використовуйте на власний ризик.

## Назви

ID каналу — `zalouser`, щоб чітко показати, що це автоматизація **особистого облікового запису користувача Zalo** (неофіційна). Назву `zalo` ми зберігаємо для можливої майбутньої офіційної інтеграції з API Zalo.

## Де це працює

Цей Plugin працює **усередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установлюйте/налаштовуйте його на **машині, де працює Gateway**, а потім перезапустіть Gateway.

Зовнішній CLI binary `zca`/`openzca` не потрібен.

## Установлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної теки (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Конфігурація каналу знаходиться в `channels.zalouser` (а не в `plugins.entries.*`):

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

## Інструмент агента

Назва інструмента: `zalouser`

Дії: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Дії з повідомленнями каналу також підтримують `react` для реакцій на повідомлення.
