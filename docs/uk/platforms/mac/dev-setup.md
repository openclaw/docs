---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над macOS-застосунком OpenClaw
title: Налаштування розробки для macOS
x-i18n:
    generated_at: "2026-04-27T06:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f936c25513cf04de2c97c07e50a20b2797157ec52ef848d143722bf51a045100
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Налаштування розробки для macOS

Збірка і запуск macOS-застосунку OpenClaw з вихідного коду.

## Передумови

Перш ніж збирати застосунок, переконайтеся, що у вас встановлено таке:

1. **Xcode 26.2+**: потрібний для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для Gateway, CLI і скриптів пакування. Node 22 LTS, наразі `22.14+`, також залишається підтримуваним для сумісності.

## 1. Встановіть залежності

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати macOS-застосунок і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Інформацію про режими dev-запуску, прапорці підпису та усунення проблем з Team ID дивіться в README для macOS-застосунку:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Застосунки, підписані ad-hoc, можуть викликати системні попередження безпеки. Якщо застосунок одразу завершується з помилкою "Abort trap 6", дивіться розділ [Усунення несправностей](#усунення-несправностей).

## 3. Встановіть CLI

macOS-застосунок очікує глобально встановлений CLI `openclaw` для керування фоновими завданнями.

**Щоб встановити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Альтернативно можна встановити його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для runtime Gateway Node усе ще залишається рекомендованим шляхом.

## Усунення несправностей

### Збірка не вдається: невідповідність toolchain або SDK

Збірка macOS-застосунку очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язково):**

- **Найновіша доступна версія macOS у Software Update** (потрібна для SDK у Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторіть збірку.

### Застосунок падає під час надання дозволу

Якщо застосунок падає, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, причиною може бути пошкоджений кеш TCC або невідповідність підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб примусово отримати «чистий стан» з боку macOS.

### Gateway назавжди зависає на "Starting..."

Якщо статус gateway залишається на "Starting...", перевірте, чи zombie-процес не утримує порт:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (dev mode / ручні запуски), знайдіть процес, що слухає порт:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.

## Пов’язане

- [macOS-застосунок](/uk/platforms/macos)
- [Огляд встановлення](/uk/install)
