---
read_when:
    - Створення або підписування налагоджувальних збірок для Mac
summary: Етапи підписування налагоджувальних збірок для macOS, створених сценаріями пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-07-16T18:11:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Підписування macOS (налагоджувальні збірки)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) збирає та пакує застосунок у фіксований шлях (`dist/OpenClaw.app`), а потім викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати його. Дозволи TCC прив’язані до ідентифікатора пакета й підпису коду; якщо обидва залишаються незмінними (а застосунок — за фіксованим шляхом) між повторними збірками, macOS не забуває надані дозволи TCC (сповіщення, спеціальні можливості, запис екрана, мікрофон, розпізнавання мовлення).

- Ідентифікатор пакета налагоджувальної збірки за замовчуванням — `ai.openclaw.mac.debug` (перевизначається за допомогою `BUNDLE_ID=...`).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` або `>=25.9.0` (репозиторій `package.json` `engines`). Пакувальник також збирає інтерфейс керування (`pnpm ui:build`).
- За замовчуванням потрібен справжній ідентифікатор підписування; якщо його не знайдено й `ALLOW_ADHOC_SIGNING` не задано, сценарій підписування коду завершується з помилкою. Спеціальне підписування (`SIGN_IDENTITY="-"`) потребує явного ввімкнення й не зберігає дозволи TCC між повторними збірками. Див. [Дозволи macOS](/uk/platforms/mac/permissions).
- Зчитує `SIGN_IDENTITY` із середовища (наприклад, `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` або сертифікат Developer ID Application). Якщо його немає, `codesign-mac-app.sh` автоматично вибирає ідентифікатор у такому порядку: Developer ID Application, Apple Distribution, Apple Development, а потім перший знайдений дійсний ідентифікатор підписування коду.
- `CODESIGN_TIMESTAMP=auto` (за замовчуванням) вмикає довірені часові позначки лише для підписів Developer ID Application. Задайте `on`/`off`, щоб примусово вибрати потрібний варіант.
- Додає до Info.plist поля `OpenClawBuildTimestamp` (ISO8601 UTC) та `OpenClawGitCommit` (короткий хеш, `unknown`, якщо він недоступний), щоб на вкладці «Про програму» можна було показати збірку, дані git і канал налагоджувальної або релізної версії.
- Після підписування виконує перевірку Team ID і завершується з помилкою, якщо будь-який файл Mach-O всередині пакета має інший Team ID. Задайте `SKIP_TEAM_ID_CHECK=1`, щоб пропустити перевірку.

## Використання

```bash
# із кореня репозиторію
scripts/package-mac-app.sh                                                      # автоматично вибирає ідентифікатор; помилка, якщо його не знайдено
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # справжній сертифікат
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # спеціальне підписування (дозволи не зберігатимуться)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # явне спеціальне підписування (те саме застереження)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # обхід невідповідності Team ID Sparkle лише для розробки
```

### Примітка щодо спеціального підписування

`SIGN_IDENTITY="-"` вимикає Hardened Runtime (`--options runtime`), щоб запобігти аварійному завершенню, коли застосунок завантажує вбудовані фреймворки (як-от Sparkle), що мають інший Team ID. Спеціальні підписи також порушують збереження дозволів TCC; кроки відновлення наведено в розділі [Дозволи macOS](/uk/platforms/mac/permissions).

## Метадані збірки для вкладки «Про програму»

Вкладка «Про програму» зчитує `OpenClawBuildTimestamp` та `OpenClawGitCommit` з Info.plist, щоб показати версію, дату збірки, коміт git і чи є збірка налагоджувальною (через `#if DEBUG`). Після змін у коді повторно запустіть пакувальник, щоб оновити ці значення.

## Пов’язані матеріали

- [Застосунок macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
