---
read_when:
    - Сборка или подпись отладочных сборок для Mac
summary: Шаги подписи для отладочных сборок macOS, созданных скриптами упаковки
title: Подписывание macOS
x-i18n:
    generated_at: "2026-06-28T23:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# подписание mac (отладочные сборки)

Это приложение обычно собирается с помощью [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), который теперь:

- задает стабильный идентификатор отладочного bundle: `ai.openclaw.mac.debug`
- записывает Info.plist с этим идентификатором bundle (переопределение через `BUNDLE_ID=...`)
- вызывает [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), чтобы подписать основной бинарный файл и bundle приложения, благодаря чему macOS воспринимает каждую пересборку как тот же подписанный bundle и сохраняет разрешения TCC (уведомления, универсальный доступ, запись экрана, микрофон, речь). Для стабильных разрешений используйте настоящую удостоверяющую подпись; ad-hoc включается явно и ненадежен (см. [разрешения macOS](/ru/platforms/mac/permissions)).
- по умолчанию использует `CODESIGN_TIMESTAMP=auto`; это включает доверенные временные метки для подписей Developer ID. Установите `CODESIGN_TIMESTAMP=off`, чтобы пропустить временные метки (офлайн-отладочные сборки).
- внедряет метаданные сборки в Info.plist: `OpenClawBuildTimestamp` (UTC) и `OpenClawGitCommit` (короткий хеш), чтобы панель «О программе» могла показывать сборку, git и канал debug/release.
- **Упаковка по умолчанию использует Node 24**: скрипт запускает сборки TS и сборку пользовательского интерфейса управления. Node 22 LTS, сейчас `22.19+`, остается поддерживаемым для совместимости.
- читает `SIGN_IDENTITY` из окружения. Добавьте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (или ваш сертификат Developer ID Application) в rc-файл вашей shell, чтобы всегда подписывать вашим сертификатом. Ad-hoc-подписание требует явного включения через `ALLOW_ADHOC_SIGNING=1` или `SIGN_IDENTITY="-"` (не рекомендуется для тестирования разрешений).
- запускает аудит идентификатора команды после подписания и завершается с ошибкой, если какой-либо Mach-O внутри bundle приложения подписан другим идентификатором команды. Установите `SKIP_TEAM_ID_CHECK=1`, чтобы обойти проверку.

## Использование

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Примечание об ad-hoc-подписании

При подписании с `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматически отключает **усиленную среду выполнения** (`--options runtime`). Это необходимо, чтобы предотвратить сбои, когда приложение пытается загрузить встроенные фреймворки (например, Sparkle), которые не используют тот же идентификатор команды. Ad-hoc-подписи также нарушают сохранение разрешений TCC; шаги восстановления см. в [разрешениях macOS](/ru/platforms/mac/permissions).

## Метаданные сборки для «О программе»

`package-mac-app.sh` помечает bundle следующими данными:

- `OpenClawBuildTimestamp`: ISO8601 UTC на момент упаковки
- `OpenClawGitCommit`: короткий git-хеш (или `unknown`, если недоступен)

Вкладка «О программе» читает эти ключи, чтобы показать версию, дату сборки, git-коммит и является ли это отладочной сборкой (через `#if DEBUG`). Запускайте упаковщик после изменений кода, чтобы обновить эти значения.

## Зачем

Разрешения TCC привязаны к идентификатору bundle _и_ подписи кода. Неподписанные отладочные сборки с меняющимися UUID приводили к тому, что macOS забывала выданные разрешения после каждой пересборки. Подписание бинарных файлов (по умолчанию ad-hoc) и сохранение фиксированного идентификатора/пути bundle (`dist/OpenClaw.app`) сохраняет разрешения между сборками, как в подходе VibeTunnel.

## Связанные материалы

- [приложение macOS](/ru/platforms/macos)
- [разрешения macOS](/ru/platforms/mac/permissions)
