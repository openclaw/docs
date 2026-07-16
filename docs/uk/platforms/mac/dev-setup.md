---
read_when:
    - Налаштування середовища розробки macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування середовища розробки macOS
x-i18n:
    generated_at: "2026-07-16T18:10:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування середовища розробки для macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

- **Xcode 26.2+** (набір інструментів Swift 6.2) на найновішій версії macOS, доступній у
  Software Update.
- **Node.js 24.15+ і pnpm** для Gateway, CLI та сценаріїв пакування. Node
  22.22.3+ також працює.

## 1. Установіть залежності

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

```bash
./scripts/package-mac-app.sh
```

Результат буде збережено в `dist/OpenClaw.app`. Без сертифіката Apple Developer ID
сценарій використовує спеціальний підпис.

Режими запуску для розробки, прапорці підписування та способи усунення проблем з Team ID описано у
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Швидкий цикл розробки з кореня репозиторію: `scripts/restart-mac.sh` (додайте `--no-sign` для
спеціального підписування; дозволи TCC не зберігаються з `--no-sign`).

<Note>
Застосунки зі спеціальним підписом можуть спричиняти появу запитів безпеки. Якщо застосунок
негайно аварійно завершує роботу з повідомленням "Abort trap 6", див. [Усунення несправностей](#troubleshooting).
</Note>

## 3. Установіть CLI та Gateway

Запакований застосунок містить канонічний інсталятор `scripts/install-cli.sh`. У
новому профілі виберіть **This Mac** під час початкового налаштування; застосунок установлює
відповідні CLI та середовище виконання в просторі користувача перед запуском майстра Gateway.

Для ручного відновлення середовища розробки самостійно встановіть відповідний CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також
працюють. Node залишається рекомендованим середовищем виконання для самого Gateway.

## Усунення несправностей

### Помилка збірки: невідповідність набору інструментів або SDK

Для збірки застосунку macOS потрібні найновіший macOS SDK і набір інструментів Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не відповідають вимогам, оновіть macOS/Xcode та повторно запустіть збірку.

### Застосунок аварійно завершує роботу під час надання дозволу

Якщо застосунок аварійно завершує роботу під час спроби надати доступ до **Speech Recognition** або
**Microphone**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

1. Скиньте дозволи TCC для ідентифікатора пакета налагодження:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   щоб примусово почати з чистого стану macOS.

### Gateway нескінченно перебуває у стані "Starting..."

Перевірте, чи не утримує порт зомбі-процес:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (режим розробки / ручні запуски), знайдіть процес, що прослуховує порт:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує процес, запущений вручну, зупиніть його (Ctrl+C) або, у крайньому разі,
завершіть процес за PID, знайденим вище.

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [Огляд установлення](/uk/install)
