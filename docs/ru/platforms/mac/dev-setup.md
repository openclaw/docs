---
read_when:
    - Настройка среды разработки macOS
summary: Руководство по настройке для разработчиков, работающих над приложением OpenClaw для macOS
title: Настройка среды разработки в macOS
x-i18n:
    generated_at: "2026-07-13T18:18:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Настройка среды разработки macOS

Сборка и запуск приложения OpenClaw для macOS из исходного кода.

## Предварительные требования

- **Xcode 26.2+** (набор инструментов Swift 6.2) и последняя версия macOS, доступная в
  Software Update.
- **Node.js 24.15+ и pnpm** для Gateway, CLI и сценариев упаковки. Node
  22.22.3+ также поддерживается.

## 1. Установите зависимости

```bash
pnpm install
```

## 2. Соберите и упакуйте приложение

```bash
./scripts/package-mac-app.sh
```

Результат сохраняется в `dist/OpenClaw.app`. Если сертификат Apple Developer ID отсутствует,
сценарий использует специальную подпись.

Режимы запуска для разработки, параметры подписи и устранение неполадок с Team ID описаны в
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Быстрый цикл разработки из корня репозитория: `scripts/restart-mac.sh` (добавьте `--no-sign` для
специальной подписи; разрешения TCC не сохраняются при использовании `--no-sign`).

<Note>
Приложения со специальной подписью могут вызывать предупреждения системы безопасности. Если приложение
сразу завершает работу с ошибкой «Abort trap 6», см. раздел [Устранение неполадок](#troubleshooting).
</Note>

## 3. Установите CLI и Gateway

В упакованное приложение встроен стандартный установщик `scripts/install-cli.sh`. В
новом профиле во время первоначальной настройки выберите **This Mac**; приложение установит
соответствующие пользовательские CLI и среду выполнения перед запуском мастера Gateway.

Для ручного восстановления среды разработки самостоятельно установите соответствующую версию CLI:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` и `bun add -g openclaw@<version>` также
поддерживаются. Node остаётся рекомендуемой средой выполнения для самого Gateway.

## Устранение неполадок

### Сбой сборки: несовместимость набора инструментов или SDK

Для сборки приложения macOS требуются последняя версия macOS SDK и набор инструментов Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Если версии не соответствуют требованиям, обновите macOS/Xcode и повторите сборку.

### Приложение аварийно завершается при предоставлении разрешения

Если приложение аварийно завершается при попытке разрешить доступ к **Speech Recognition** или
**Microphone**, причиной может быть повреждённый кеш TCC или несовпадение подписи.

1. Сбросьте разрешения TCC для идентификатора отладочного пакета:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Если это не поможет, временно измените `BUNDLE_ID` в
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh),
   чтобы macOS создала настройки с чистого листа.

### Gateway бесконечно отображает «Starting...»

Проверьте, не удерживает ли порт зависший процесс:

```bash
openclaw gateway status
openclaw gateway stop

# Если вы не используете LaunchAgent (режим разработки / ручной запуск), найдите прослушивающий процесс:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Если порт удерживается процессом, запущенным вручную, остановите его (Ctrl+C) или в крайнем случае
завершите процесс с найденным выше PID.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [Обзор установки](/ru/install)
