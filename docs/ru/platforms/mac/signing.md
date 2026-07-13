---
read_when:
    - Сборка или подпись отладочных сборок для macOS
summary: Этапы подписывания отладочных сборок macOS, созданных скриптами упаковки
title: Подписание в macOS
x-i18n:
    generated_at: "2026-07-13T19:58:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Подписание macOS (отладочные сборки)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) собирает и упаковывает приложение по фиксированному пути (`dist/OpenClaw.app`), а затем вызывает [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) для его подписания. Разрешения TCC привязаны к идентификатору пакета и подписи кода; сохранение обоих неизменными (и размещение приложения по фиксированному пути) при повторных сборках не позволяет macOS забывать предоставленные разрешения TCC (уведомления, универсальный доступ, запись экрана, микрофон, распознавание речи).

- Идентификатор отладочного пакета по умолчанию — `ai.openclaw.mac.debug` (переопределяется с помощью `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` или `>=25.9.0` (`package.json` репозитория — `engines`). Упаковщик также собирает интерфейс управления (`pnpm ui:build`).
- По умолчанию требуется настоящий сертификат подписи; если он не найден и `ALLOW_ADHOC_SIGNING` не задан, скрипт подписания завершается с ошибкой. Для использования ситуативной подписи (`SIGN_IDENTITY="-"`) требуется явное согласие, и такая подпись не сохраняет разрешения TCC между повторными сборками. См. [разрешения macOS](/ru/platforms/mac/permissions).
- Считывает `SIGN_IDENTITY` из окружения (например, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` или сертификат Developer ID Application). Если значение не задано, `codesign-mac-app.sh` автоматически выбирает сертификат в следующем порядке: Developer ID Application, Apple Distribution, Apple Development, затем первый найденный действительный сертификат подписи кода.
- `CODESIGN_TIMESTAMP=auto` (по умолчанию) включает доверенные метки времени только для подписей Developer ID Application. Задайте `on`/`off`, чтобы принудительно включить или отключить их.
- Добавляет в Info.plist значения `OpenClawBuildTimestamp` (ISO8601 UTC) и `OpenClawGitCommit` (короткий хеш, `unknown`, если он недоступен), чтобы на вкладке «Об приложении» отображались сведения о сборке, git и канале отладочной или выпускной версии.
- После подписания выполняет проверку идентификатора команды и завершается с ошибкой, если какой-либо файл Mach-O внутри пакета имеет другой идентификатор команды. Задайте `SKIP_TEAM_ID_CHECK=1`, чтобы пропустить проверку.

## Использование

```bash
# из корня репозитория
scripts/package-mac-app.sh                                                      # автоматически выбирает сертификат; ошибка, если он не найден
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # настоящий сертификат
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ситуативная подпись (разрешения не сохранятся)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # явная ситуативная подпись (с той же оговоркой)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # обходной путь только для разработки при несовпадении идентификатора команды Sparkle
```

### Примечание о ситуативном подписании

`SIGN_IDENTITY="-"` отключает Hardened Runtime (`--options runtime`), чтобы предотвратить сбои при загрузке приложением встроенных фреймворков (например, Sparkle), у которых нет того же идентификатора команды. Ситуативные подписи также нарушают сохранение разрешений TCC; инструкции по восстановлению см. в разделе [разрешения macOS](/ru/platforms/mac/permissions).

## Метаданные сборки для вкладки «Об приложении»

Вкладка «Об приложении» считывает `OpenClawBuildTimestamp` и `OpenClawGitCommit` из Info.plist, чтобы отображать версию, дату сборки, коммит git и признак отладочной сборки DEBUG (через `#if DEBUG`). После изменения кода повторно запустите упаковщик, чтобы обновить эти значения.

## Связанные материалы

- [Приложение macOS](/ru/platforms/macos)
- [Разрешения macOS](/ru/platforms/mac/permissions)
