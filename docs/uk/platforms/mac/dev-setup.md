---
read_when:
    - Налаштування середовища розробки macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування середовища розробки на macOS
x-i18n:
    generated_at: "2026-06-27T17:46:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування середовища розробника macOS

Зберіть і запустіть застосунок OpenClaw для macOS з вихідного коду.

## Передумови

Перед збиранням застосунку переконайтеся, що у вас встановлено таке:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.19+`, і далі підтримується для сумісності.

## 1. Установіть залежності

Установіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати застосунок macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **підпис ad-hoc** (`-`).

Режими запуску для розробки, прапорці підпису та усунення проблем із Team ID див. у README застосунку macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: застосунки з підписом ad-hoc можуть викликати запити безпеки. Якщо застосунок одразу завершується з помилкою "Abort trap 6", див. розділ [Усунення несправностей](#troubleshooting).

## 3. Установіть CLI

Застосунок macOS очікує глобальне встановлення CLI `openclaw` для керування фоновими завданнями.

**Щоб установити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **Загальні**.
3. Натисніть **"Установити CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для середовища виконання Gateway рекомендованим шляхом залишається Node.

## Усунення несправностей

### Помилка збирання: невідповідність toolchain або SDK

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

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Розпізнавання мовлення** або **Мікрофона**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб macOS почала з "чистого аркуша".

### Gateway нескінченно показує "Запускається..."

Якщо статус gateway залишається "Запускається...", перевірте, чи порт не утримує zombie-процес:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, знайдений вище.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Огляд установлення](/uk/install)
