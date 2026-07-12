---
read_when:
    - Налаштування середовища розробки macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування середовища розробки macOS
x-i18n:
    generated_at: "2026-07-12T13:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування середовища розробки для macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

- **Xcode 26.2+** (набір інструментів Swift 6.2) в останній версії macOS, доступній у
  Software Update.
- **Node.js 24 і pnpm** для Gateway, CLI та сценаріїв пакування. Node
  22.19+ також підтримується.

## 1. Установіть залежності

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

```bash
./scripts/package-mac-app.sh
```

Результат — `dist/OpenClaw.app`. Якщо сертифіката Apple Developer ID немає,
сценарій використовує ситуативне підписування.

Відомості про режими запуску для розробки, параметри підписування та усунення проблем з Team ID див. у
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Швидкий цикл розробки з кореня репозиторію: `scripts/restart-mac.sh` (додайте `--no-sign` для
ситуативного підписування; дозволи TCC не зберігаються з `--no-sign`).

<Note>
Застосунки із ситуативним підписом можуть спричиняти появу попереджень системи безпеки. Якщо застосунок
негайно завершує роботу з повідомленням "Abort trap 6", див. [Усунення проблем](#troubleshooting).
</Note>

## 3. Установіть CLI та Gateway

Запакований застосунок містить канонічний інсталятор `scripts/install-cli.sh`. У
новому профілі під час початкового налаштування виберіть **This Mac**; перед запуском майстра Gateway застосунок установлює
відповідні користувацькі CLI та середовище виконання.

Для ручного відновлення середовища розробки самостійно встановіть відповідну версію CLI:

```bash
npm install -g openclaw@<version>
```

Також підтримуються `pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>`.
Node залишається рекомендованим середовищем виконання безпосередньо для Gateway.

## Усунення проблем

### Помилка збирання: невідповідність набору інструментів або SDK

Для збирання застосунку для macOS потрібні найновіша версія macOS SDK і набір інструментів Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не відповідають вимогам, оновіть macOS/Xcode і повторіть збирання.

### Застосунок аварійно завершує роботу під час надання дозволу

Якщо застосунок аварійно завершує роботу, коли ви намагаєтеся надати доступ до **Speech Recognition** або
**Microphone**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

1. Скиньте дозволи TCC для ідентифікатора пакета налагоджувальної версії:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   щоб macOS створила чисте середовище.

### Gateway нескінченно відображає "Starting..."

Перевірте, чи не утримує порт зомбі-процес:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (режим розробки / ручні запуски), знайдіть процес, що прослуховує порт:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує вручну запущений процес, зупиніть його (Ctrl+C) або, у крайньому разі,
завершіть процес за знайденим вище PID.

## Пов’язані матеріали

- [Застосунок для macOS](/uk/platforms/macos)
- [Огляд установлення](/uk/install)
