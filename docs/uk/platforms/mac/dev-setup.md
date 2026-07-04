---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування macOS для розробки
x-i18n:
    generated_at: "2026-07-04T06:49:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Налаштування розробника macOS

Зберіть і запустіть застосунок OpenClaw для macOS із вихідного коду.

## Передумови

Перед збиранням застосунку переконайтеся, що у вас установлено таке:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для Gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.19+`, і далі підтримується для сумісності.

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

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc підписування** (`-`).

Про режими запуску для розробки, прапорці підписування та усунення проблем із Team ID див. README застосунку macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: застосунки з ad-hoc підписуванням можуть викликати запити безпеки. Якщо застосунок одразу аварійно завершується з "Abort trap 6", див. розділ [Усунення несправностей](#troubleshooting).

## 3. Установіть CLI і Gateway

Запакований застосунок вбудовує канонічний інсталятор `scripts/install-cli.sh`. У
новому профілі під час онбордингу виберіть **Цей Mac**; застосунок установлює
відповідні користувацькі CLI і середовище виконання перед запуском майстра Gateway.

Для ручного відновлення середовища розробки самостійно встановіть відповідний CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для середовища виконання Gateway Node і далі є рекомендованим шляхом.

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

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Розпізнавання мовлення** або **Мікрофона**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб macOS почала з "чистого аркуша".

### Gateway нескінченно показує "Запуск..."

Якщо стан Gateway залишається "Запуск...", перевірте, чи не утримує порт zombie-процес:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (режим розробки / ручні запуски), знайдіть слухача:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). Як крайній захід, завершіть PID, знайдений вище.

## Пов’язано

- [Застосунок macOS](/uk/platforms/macos)
- [Огляд установлення](/uk/install)
