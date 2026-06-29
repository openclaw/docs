---
read_when:
    - Настройка среды разработки macOS
summary: Руководство по настройке для разработчиков, работающих над приложением OpenClaw для macOS
title: Настройка среды разработки на macOS
x-i18n:
    generated_at: "2026-06-28T23:12:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Настройка среды разработки macOS

Соберите и запустите приложение OpenClaw для macOS из исходного кода.

## Предварительные требования

Перед сборкой приложения убедитесь, что у вас установлено следующее:

1. **Xcode 26.2+**: требуется для разработки на Swift.
2. **Node.js 24 и pnpm**: рекомендуется для Gateway, CLI и скриптов упаковки. Node 22 LTS, сейчас `22.19+`, по-прежнему поддерживается для совместимости.

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

> **Примечание**: Приложения с ad-hoc-подписью могут вызывать запросы безопасности. Если приложение сразу аварийно завершается с "Abort trap 6", см. раздел [Устранение неполадок](#troubleshooting).

## 3. Установите CLI

Приложение macOS ожидает глобальную установку CLI `openclaw` для управления фоновыми задачами.

**Чтобы установить его (рекомендуется):**

1. Откройте приложение OpenClaw.
2. Перейдите на вкладку настроек **Общие**.
3. Нажмите **"Установить CLI"**.

Либо установите его вручную:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` и `bun add -g openclaw@<version>` также работают.
Для среды выполнения Gateway рекомендуемым вариантом остается Node.

## Устранение неполадок

### Сборка завершается с ошибкой: несоответствие toolchain или SDK

Сборка приложения macOS ожидает новейший macOS SDK и toolchain Swift 6.2.

**Системные зависимости (обязательно):**

- **Последняя версия macOS, доступная в «Обновлении ПО»** (требуется для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Проверки:**

```bash
xcodebuild -version
xcrun swift --version
```

Если версии не совпадают, обновите macOS/Xcode и повторно запустите сборку.

### Приложение аварийно завершается при выдаче разрешения

Если приложение аварийно завершается, когда вы пытаетесь разрешить доступ к **Распознаванию речи** или **Микрофону**, причиной может быть поврежденный кэш TCC или несоответствие подписи.

**Исправление:**

1. Сбросьте разрешения TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Если это не помогло, временно измените `BUNDLE_ID` в [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), чтобы macOS создала новое «чистое» состояние.

### Gateway бесконечно показывает «Запуск...»

Если статус Gateway остается «Запуск...», проверьте, не удерживает ли порт зомби-процесс:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Если порт удерживается ручным запуском, остановите этот процесс (Ctrl+C). В крайнем случае завершите найденный выше PID.

## См. также

- [Приложение macOS](/ru/platforms/macos)
- [Обзор установки](/ru/install)
