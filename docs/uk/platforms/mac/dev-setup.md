---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування розробки для macOS
x-i18n:
    generated_at: "2026-04-23T21:00:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a2b3c4c8ba5a601c26e672bc2f5b2e469d696b09c2d01292192345031395882
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Налаштування розробки для macOS

Цей посібник охоплює потрібні кроки для збирання та запуску застосунку OpenClaw для macOS із вихідного коду.

## Передумови

Перш ніж збирати застосунок, переконайтеся, що у вас встановлено:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 & pnpm**: рекомендовано для gateway, CLI і скриптів пакування. Node 22 LTS, наразі `22.14+`, залишається підтримуваним для сумісності.

## 1. Установіть залежності

Установіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати застосунок для macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Для режимів dev-run, прапорців підписування та усунення несправностей із Team ID див. README застосунку для macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Ad-hoc signed застосунки можуть викликати системні запити безпеки. Якщо застосунок аварійно завершується одразу з помилкою "Abort trap 6", див. розділ [Усунення несправностей](#усунення-несправностей).

## 3. Установіть CLI

Застосунок macOS очікує глобального встановлення CLI `openclaw` для керування фоновими завданнями.

**Щоб установити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

Також працюють `pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>`.
Для runtime Gateway шлях через Node залишається рекомендованим.

## Усунення несправностей

### Збірка завершується помилкою: невідповідність toolchain або SDK

Збірка застосунку macOS очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язково):**

- **Остання версія macOS, доступна в Software Update** (потрібна для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторно запустіть збірку.

### Застосунок аварійно завершується під час надання дозволу

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, це може бути пов’язано з пошкодженим кешем TCC або невідповідністю підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб примусово створити «чистий аркуш» з боку macOS.

### Gateway зависає на "Starting..."

Якщо статус gateway залишається на "Starting...", перевірте, чи не утримує порт zombie-процес:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (dev mode / ручні запуски), знайдіть listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.
