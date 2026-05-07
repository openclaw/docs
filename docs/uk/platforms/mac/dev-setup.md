---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування середовища розробки macOS
x-i18n:
    generated_at: "2026-05-07T15:08:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування розробника macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

Перед збиранням застосунку переконайтеся, що у вас установлено:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для Gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.16+`, залишається підтримуваним для сумісності.

## 1. Встановіть залежності

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати застосунок macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Про режими запуску для розробки, прапорці підписування та усунення проблем із Team ID див. README застосунку macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: застосунки з ad-hoc підписом можуть викликати запити безпеки. Якщо застосунок одразу аварійно завершується з "Abort trap 6", див. розділ [Усунення несправностей](#troubleshooting).

## 3. Встановіть CLI

Застосунок macOS очікує глобальне встановлення CLI `openclaw` для керування фоновими завданнями.

**Щоб встановити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для середовища виконання Gateway рекомендованим шляхом залишається Node.

## Усунення несправностей

### Збирання не вдається: невідповідність toolchain або SDK

Збирання застосунку macOS очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язково):**

- **Найновіша версія macOS, доступна в Software Update** (потрібна для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторно запустіть збирання.

### Застосунок аварійно завершується під час надання дозволу

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, це може бути спричинено пошкодженим кешем TCC або невідповідністю підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допомогло, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб змусити macOS почати з "чистого аркуша".

### Gateway нескінченно показує "Starting..."

Якщо статус Gateway залишається "Starting...", перевірте, чи не утримує порт zombie-процес:

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
