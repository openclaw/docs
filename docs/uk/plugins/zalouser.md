---
read_when:
    - Вам потрібна підтримка Zalo Personal (неофіційна) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin zalouser
summary: 'Plugin Zalo Personal: вхід через QR + обмін повідомленнями через нативний zca-js (встановлення Plugin + конфігурація каналу + інструмент)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-27T06:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9fc40683980ea73cb0b547d9e327f18e100ed9b6646512d9755934d19a48b9c
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Підтримка Zalo Personal для OpenClaw через Plugin, що використовує нативний `zca-js` для автоматизації звичайного особистого акаунта Zalo.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування акаунта. Використовуйте на власний ризик.
</Warning>

## Назва

Id каналу — `zalouser`, щоб явно показати, що це автоматизація **особистого акаунта користувача Zalo** (неофіційна). `zalo` зарезервовано для можливої майбутньої офіційної інтеграції з API Zalo.

## Де це працює

Цей Plugin працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте його на **комп’ютері, де запущено Gateway**, а потім перезапустіть Gateway.

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Встановлення

### Варіант A: встановлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної папки (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Конфігурація каналу розміщується в `channels.zalouser` (а не в `plugins.entries.*`):

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

Дії повідомлень каналу також підтримують `react` для реакцій на повідомлення.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Спільнотні Plugin](/uk/plugins/community)
