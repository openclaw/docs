---
read_when:
    - Сборка или подписание отладочных сборок для macOS
summary: Шаги подписания отладочных сборок macOS, созданных скриптами упаковки
title: Подписание для macOS
x-i18n:
    generated_at: "2026-07-12T11:33:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Подпись mac (отладочные сборки)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) собирает и упаковывает приложение по фиксированному пути (`dist/OpenClaw.app`), а затем вызывает [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) для его подписи. Разрешения TCC привязаны к идентификатору пакета и подписи кода; если оба параметра остаются неизменными (а приложение сохраняет фиксированный путь) при повторных сборках, macOS не забывает предоставленные разрешения TCC (уведомления, универсальный доступ, запись экрана, микрофон, распознавание речи).

- По умолчанию идентификатор отладочного пакета — `ai.openclaw.mac.debug` (можно переопределить с помощью `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` или `>=23.11.0` (`engines` в `package.json` репозитория). Упаковщик также собирает интерфейс управления (`pnpm ui:build`).
- По умолчанию требуется реальный сертификат подписи; если он не найден и переменная `ALLOW_ADHOC_SIGNING` не задана, скрипт подписи завершается с ошибкой. Одноразовая подпись (`SIGN_IDENTITY="-"`) включается только явно и не сохраняет разрешения TCC между повторными сборками. См. [разрешения macOS](/ru/platforms/mac/permissions).
- Считывает `SIGN_IDENTITY` из окружения (например, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` или сертификат Developer ID Application). Если переменная не задана, `codesign-mac-app.sh` автоматически выбирает сертификат в следующем порядке: Developer ID Application, Apple Distribution, Apple Development, а затем первый найденный действительный сертификат для подписи кода.
- `CODESIGN_TIMESTAMP=auto` (по умолчанию) включает доверенные метки времени только для подписей Developer ID Application. Укажите `on` или `off`, чтобы принудительно включить или отключить их.
- Добавляет в Info.plist поля `OpenClawBuildTimestamp` (время UTC в формате ISO8601) и `OpenClawGitCommit` (короткий хеш или `unknown`, если он недоступен), чтобы на вкладке «О программе» отображались данные о сборке, git и канале отладочной или релизной версии.
- После подписания выполняет проверку Team ID и завершается с ошибкой, если какой-либо файл Mach-O внутри пакета имеет другой Team ID. Чтобы пропустить проверку, задайте `SKIP_TEAM_ID_CHECK=1`.

## Использование

```bash
# из корня репозитория
scripts/package-mac-app.sh                                                      # автоматически выбирает сертификат; завершается с ошибкой, если сертификат не найден
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # реальный сертификат
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # одноразовая подпись (разрешения не сохранятся)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # явная одноразовая подпись (с тем же ограничением)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # обход несовпадения Team ID Sparkle только для разработки
```

### Примечание об одноразовой подписи

`SIGN_IDENTITY="-"` отключает Hardened Runtime (`--options runtime`), чтобы предотвратить сбои при загрузке приложением встроенных фреймворков (например, Sparkle), у которых отличается Team ID. Одноразовые подписи также нарушают сохранение разрешений TCC; инструкции по восстановлению см. в разделе [разрешения macOS](/ru/platforms/mac/permissions).

## Метаданные сборки для раздела «О программе»

Вкладка «О программе» считывает `OpenClawBuildTimestamp` и `OpenClawGitCommit` из Info.plist, чтобы отображать версию, дату сборки, коммит git и тип сборки DEBUG (через `#if DEBUG`). После изменения кода повторно запустите упаковщик, чтобы обновить эти значения.

## Связанные материалы

- [Приложение для macOS](/ru/platforms/macos)
- [Разрешения macOS](/ru/platforms/mac/permissions)
