---
read_when:
    - Настройка среды разработки macOS
summary: Руководство по настройке для разработчиков, работающих над приложением OpenClaw для macOS
title: Настройка среды разработки на macOS
x-i18n:
    generated_at: "2026-07-04T06:44:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Настройка среды разработки macOS

Сборка и запуск приложения OpenClaw для macOS из исходного кода.

## Предварительные требования

Перед сборкой приложения убедитесь, что у вас установлено следующее:

1. **Xcode 26.2+**: требуется для разработки на Swift.
2. **Node.js 24 и pnpm**: рекомендуется для Gateway, CLI и скриптов упаковки. Node 22 LTS, в настоящее время `22.19+`, по-прежнему поддерживается для совместимости.

## 1. Установите зависимости

Установите зависимости для всего проекта:

```bash
pnpm install
```

## 2. Соберите и упакуйте приложение

Чтобы собрать приложение macOS и упаковать его в `dist/OpenClaw.app`, выполните:

```bash
./scripts/package-mac-app.sh
```

Если у вас нет сертификата Apple Developer ID, скрипт автоматически использует **ad-hoc-подпись** (`-`).

Режимы запуска для разработки, флаги подписи и устранение неполадок с Team ID описаны в README приложения macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примечание**: приложения с ad-hoc-подписью могут вызывать запросы безопасности. Если приложение сразу аварийно завершается с сообщением "Abort trap 6", см. раздел [Устранение неполадок](#troubleshooting).

## 3. Установите CLI и Gateway

Упакованное приложение включает канонический установщик `scripts/install-cli.sh`. В новом профиле выберите **This Mac** во время онбординга; приложение установит соответствующие пользовательские CLI и среду выполнения перед запуском мастера Gateway.

Для ручного восстановления среды разработки установите соответствующий CLI самостоятельно:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` и `bun add -g openclaw@<version>` также работают.
Для среды выполнения Gateway рекомендуемым вариантом остается Node.

## Устранение неполадок

### Сборка завершается с ошибкой: несоответствие toolchain или SDK

Сборка приложения macOS ожидает последнюю версию macOS SDK и toolchain Swift 6.2.

**Системные зависимости (обязательно):**

- **Последняя версия macOS, доступная в Software Update** (требуется для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Проверки:**

```bash
xcodebuild -version
xcrun swift --version
```

Если версии не совпадают, обновите macOS/Xcode и повторно запустите сборку.

### Приложение аварийно завершается при выдаче разрешения

Если приложение аварийно завершается, когда вы пытаетесь разрешить доступ к **Speech Recognition** или **Microphone**, причиной может быть поврежденный кэш TCC или несоответствие подписи.

**Исправление:**

1. Сбросьте разрешения TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Если это не помогло, временно измените `BUNDLE_ID` в [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), чтобы принудительно начать с «чистого листа» в macOS.

### Gateway бесконечно показывает "Starting..."

Если статус Gateway остается "Starting...", проверьте, не удерживает ли порт зависший процесс:

```bash
openclaw gateway status
openclaw gateway stop

# Если вы не используете LaunchAgent (режим разработки / ручные запуски), найдите слушатель:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Если порт удерживает ручной запуск, остановите этот процесс (Ctrl+C). В крайнем случае завершите PID, найденный выше.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [Обзор установки](/ru/install)
