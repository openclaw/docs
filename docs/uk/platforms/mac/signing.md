---
read_when:
    - Створення або підписування налагоджувальних збірок для macOS
summary: Етапи підписування налагоджувальних збірок для macOS, створених скриптами пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-07-12T13:23:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Підписування для macOS (налагоджувальні збірки)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) збирає та пакує застосунок за фіксованим шляхом (`dist/OpenClaw.app`), а потім викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати його. Дозволи TCC прив’язані до ідентифікатора пакета та підпису коду; збереження обох незмінними (і застосунку за фіксованим шляхом) між повторними збірками не дає macOS забувати надані дозволи TCC (сповіщення, спеціальні можливості, запис екрана, мікрофон, мовлення).

- Ідентифікатор налагоджувального пакета за замовчуванням — `ai.openclaw.mac.debug` (перевизначте за допомогою `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` або `>=23.11.0` (`engines` у файлі `package.json` репозиторію). Пакувальник також збирає інтерфейс керування (`pnpm ui:build`).
- За замовчуванням потрібен справжній сертифікат підписування; якщо його не знайдено й `ALLOW_ADHOC_SIGNING` не встановлено, скрипт підписування завершує роботу з помилкою. Ситуативне підписування (`SIGN_IDENTITY="-"`) потрібно явно ввімкнути, і воно не зберігає дозволи TCC між повторними збірками. Див. [Дозволи macOS](/uk/platforms/mac/permissions).
- Зчитує `SIGN_IDENTITY` із середовища (наприклад, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` або сертифікат Developer ID Application). Якщо значення не задано, `codesign-mac-app.sh` автоматично вибирає сертифікат у такому порядку: Developer ID Application, Apple Distribution, Apple Development, а потім перший знайдений дійсний сертифікат підписування коду.
- `CODESIGN_TIMESTAMP=auto` (за замовчуванням) вмикає довірені позначки часу лише для підписів Developer ID Application. Установіть `on`/`off`, щоб примусово ввімкнути або вимкнути їх.
- Додає до Info.plist значення `OpenClawBuildTimestamp` (ISO8601 UTC) і `OpenClawGitCommit` (короткий хеш; `unknown`, якщо недоступний), щоб вкладка «Про програму» могла показувати збірку, git і канал налагоджувальної або релізної версії.
- Після підписування запускає перевірку Team ID і завершує роботу з помилкою, якщо будь-який файл Mach-O всередині пакета має інший Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб пропустити перевірку.

## Використання

```bash
# з кореня репозиторію
scripts/package-mac-app.sh                                                      # автоматично вибирає сертифікат; помилка, якщо нічого не знайдено
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # справжній сертифікат
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ситуативне підписування (дозволи не зберігатимуться)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # явне ситуативне підписування (з тим самим застереженням)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # обхід невідповідності Team ID Sparkle лише для розробки
```

### Примітка щодо ситуативного підписування

`SIGN_IDENTITY="-"` вимикає Hardened Runtime (`--options runtime`), щоб запобігти аварійному завершенню роботи, коли застосунок завантажує вбудовані фреймворки (як-от Sparkle), які не мають однакового Team ID. Ситуативні підписи також порушують збереження дозволів TCC; кроки для відновлення див. у розділі [Дозволи macOS](/uk/platforms/mac/permissions).

## Метадані збірки для вкладки «Про програму»

Вкладка «Про програму» зчитує `OpenClawBuildTimestamp` і `OpenClawGitCommit` з Info.plist, щоб показати версію, дату збірки, коміт git і те, чи є збірка налагоджувальною (за допомогою `#if DEBUG`). Після змін у коді повторно запустіть пакувальник, щоб оновити ці значення.

## Пов’язані матеріали

- [Застосунок для macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
