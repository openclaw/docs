---
read_when:
    - Вам потрібна підтримка Zalo Personal (неофіційна) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin zalouser
summary: 'Zalo Personal Plugin: вхід за QR-кодом + обмін повідомленнями через нативний zca-js (встановлення Plugin + конфігурація каналу + інструмент)'
title: Особистий Plugin Zalo
x-i18n:
    generated_at: "2026-04-29T05:40:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (plugin)

Підтримка Zalo Personal для OpenClaw через plugin із використанням нативного `zca-js` для автоматизації звичайного облікового запису користувача Zalo.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Назва

ID каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої інтеграції з офіційним API Zalo.

## Де це працює

Цей plugin працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть і налаштуйте його на **машині, де запущено Gateway**, а потім перезапустіть Gateway.

Зовнішній бінарний файл CLI `zca`/`openzca` не потрібен.

## Встановлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, ця версія пакета походить
зі старішої зовнішньої лінійки пакетів; використовуйте поточну пакетовану збірку OpenClaw або
шлях до локальної папки, доки не буде опубліковано новіший пакет npm.

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (розробка)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Конфігурація каналу розміщується в `channels.zalouser` (не в `plugins.entries.*`):

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

- [Створення plugins](/uk/plugins/building-plugins)
- [Спільнотні plugins](/uk/plugins/community)
