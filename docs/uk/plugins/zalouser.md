---
read_when:
    - Вам потрібна підтримка Zalo Personal (неофіційна) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin zalouser
summary: 'Zalo Personal Plugin: вхід через QR + обмін повідомленнями через нативний zca-js (інсталяція Plugin + конфігурація каналу + інструмент)'
title: Особистий Plugin Zalo
x-i18n:
    generated_at: "2026-05-02T21:59:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Підтримка Zalo Personal для OpenClaw через Plugin із використанням нативного `zca-js` для автоматизації звичайного облікового запису користувача Zalo.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Назва

Ідентифікатор каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої інтеграції з офіційним API Zalo.

## Де це працює

Цей Plugin працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть і налаштуйте його на **машині, де працює Gateway**, а потім перезапустіть Gateway.

Зовнішній двійковий файл CLI `zca`/`openzca` не потрібен.

## Установлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Використовуйте пакет без префіксів, щоб відстежувати поточний офіційний тег випуску. Закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення.

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (розробка)

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

- [Створення Plugin-ів](/uk/plugins/building-plugins)
- [Спільнотні Plugin-и](/uk/plugins/community)
