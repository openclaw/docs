---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування розробки для macOS
x-i18n:
    generated_at: "2026-04-27T07:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Налаштування розробки для macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

Перш ніж збирати застосунок, переконайтеся, що у вас встановлено таке:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для Gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.14+`, також підтримується для сумісності.

## 1. Встановіть залежності

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати застосунок для macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Про режими dev-запуску, прапорці підпису та усунення проблем із Team ID дивіться README застосунку для macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Застосунки, підписані ad-hoc, можуть спричиняти запити безпеки. Якщо застосунок одразу аварійно завершується з повідомленням "Abort trap 6", дивіться розділ [Усунення несправностей](#troubleshooting).

## 3. Встановіть CLI

Застосунок для macOS очікує глобально встановлений CLI `openclaw` для керування фоновими завданнями.

**Щоб встановити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для runtime Gateway рекомендованим шляхом залишається Node.

## Усунення несправностей

### Збірка завершується помилкою: невідповідність toolchain або SDK

Збірка застосунку для macOS очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язкові):**

- **Найновіша версія macOS, доступна в Software Update** (потрібна для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторно запустіть збірку.

### Застосунок аварійно завершується під час надання дозволів

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, причина може бути в пошкодженому кеші TCC або невідповідності підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб змусити macOS почати "з чистого аркуша".

### Gateway зависає на "Starting..."

Якщо статус Gateway залишається на "Starting...", перевірте, чи не утримує порт zombie-процес:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує процес, запущений вручну, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.

## Пов’язане

- [Застосунок для macOS](/uk/platforms/macos)
- [Огляд встановлення](/uk/install)
