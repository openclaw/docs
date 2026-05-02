---
read_when:
    - Вам потрібна підтримка Zalo Personal (неофіційна) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin zalouser
summary: 'Plugin Zalo Personal: вхід за QR-кодом + обмін повідомленнями через нативний zca-js (встановлення Plugin + конфігурація каналу + інструмент)'
title: Особистий Plugin Zalo
x-i18n:
    generated_at: "2026-05-02T21:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0649c95317c09fc8316ec371a357d7d41d8bf801d0d9e500a29de13388421973
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Підтримка Zalo Personal для OpenClaw через Plugin із використанням нативного `zca-js` для автоматизації звичайного облікового запису користувача Zalo.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Назви

Ідентифікатор каналу — `zalouser`, щоб явно показати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої офіційної інтеграції з Zalo API.

## Де це працює

Цей Plugin працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть і налаштуйте його на **машині, де працює Gateway**, а потім перезапустіть Gateway.

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Установлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Використовуйте `@openclaw/zalouser@beta`, коли працюєте з бета-каналом OpenClaw і npmjs
показує `beta` попереду `latest`.

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної теки (розробка)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Конфігурація каналу міститься в `channels.zalouser` (не в `plugins.entries.*`):

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

## Пов’язане

- [Створення Plugin-ів](/uk/plugins/building-plugins)
- [Спільнотні Plugin-и](/uk/plugins/community)
