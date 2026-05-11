---
read_when:
    - Вам потрібна підтримка Zalo Personal (неофіційна) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin zalouser
summary: 'Plugin Zalo Personal: вхід за QR-кодом + обмін повідомленнями через нативний zca-js (встановлення Plugin + конфігурація каналу + інструмент)'
title: Особистий Plugin Zalo
x-i18n:
    generated_at: "2026-05-11T20:53:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
---

Підтримка Zalo Personal для OpenClaw через плагін із використанням нативного `zca-js` для автоматизації звичайного облікового запису користувача Zalo.

<Warning>
Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.
</Warning>

## Іменування

Ідентифікатор каналу — `zalouser`, щоб явно вказати, що це автоматизує **особистий обліковий запис користувача Zalo** (неофіційно). Ми залишаємо `zalo` зарезервованим для потенційної майбутньої офіційної інтеграції з Zalo API.

## Де це працює

Цей плагін працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте його на **машині, де запущено Gateway**, а потім перезапустіть Gateway.

Зовнішній CLI-бінарник `zca`/`openzca` не потрібен.

## Установлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Використовуйте пакет без префіксів, щоб стежити за поточним офіційним тегом релізу. Закріплюйте точну
версію лише тоді, коли потрібне відтворюване встановлення.

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (dev)

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

- [Створення плагінів](/uk/plugins/building-plugins)
- [ClawHub](/uk/clawhub)
