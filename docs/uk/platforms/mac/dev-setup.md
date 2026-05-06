---
read_when:
    - Налаштування середовища розробки macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування macOS для розробки
x-i18n:
    generated_at: "2026-05-06T06:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування розробника macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

Перед збиранням застосунку переконайтеся, що встановлено таке:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для Gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.14+`, залишається підтримуваним для сумісності.

## 1. Встановлення залежностей

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Збирання та пакування застосунку

Щоб зібрати застосунок macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Про режими запуску для розробки, прапорці підписування та усунення проблем із Team ID див. README застосунку macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Застосунки з ad-hoc signing можуть викликати запити безпеки. Якщо застосунок одразу аварійно завершується з "Abort trap 6", див. розділ [Усунення несправностей](#troubleshooting).

## 3. Встановлення CLI

Застосунок macOS очікує глобальне встановлення CLI `openclaw` для керування фоновими завданнями.

**Щоб встановити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **Загальні**.
3. Натисніть **"Встановити CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для середовища виконання Gateway рекомендованим шляхом залишається Node.

## Усунення несправностей

### Збирання не вдається: невідповідність toolchain або SDK

Збирання застосунку macOS очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язкові):**

- **Найновіша версія macOS, доступна в Software Update** (потрібна для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторно запустіть збирання.

### Застосунок аварійно завершується під час надання дозволу

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допомогло, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб змусити macOS почати з "clean slate".

### Gateway нескінченно показує "Starting..."

Якщо статус Gateway залишається "Starting...", перевірте, чи зомбі-процес не утримує порт:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Огляд встановлення](/uk/install)
