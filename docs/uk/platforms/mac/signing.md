---
read_when:
    - Збирання або підписування налагоджувальних збірок для Mac
summary: Кроки підписання для налагоджувальних збірок macOS, згенерованих скриптами пакування
title: Підписування для macOS
x-i18n:
    generated_at: "2026-05-07T15:08:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# підписування mac (налагоджувальні збірки)

Цей застосунок зазвичай збирається з [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- задає стабільний ідентифікатор налагоджувального пакета: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором пакета (перевизначення через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати основний бінарний файл і пакет застосунку, щоб macOS сприймала кожну повторну збірку як той самий підписаний пакет і зберігала дозволи TCC (сповіщення, доступність, запис екрана, мікрофон, мовлення). Для стабільних дозволів використовуйте справжню ідентичність підписування; ad-hoc є опцією за явним вибором і крихкий (див. [дозволи macOS](/uk/platforms/mac/permissions)).
- типово використовує `CODESIGN_TIMESTAMP=auto`; це вмикає довірені часові позначки для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити додавання часової позначки (офлайн налагоджувальні збірки).
- вставляє метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель «Про програму» могла показувати збірку, git і канал debug/release.
- **Пакування типово використовує Node 24**: скрипт запускає збірки TS і збірку Control UI. Node 22 LTS, наразі `22.16+`, далі підтримується для сумісності.
- читає `SIGN_IDENTITY` із середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або ваш сертифікат Developer ID Application) до rc вашої оболонки, щоб завжди підписувати вашим сертифікатом. Підписування ad-hoc потребує явного ввімкнення через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендовано для тестування дозволів).
- запускає аудит Team ID після підписування й завершується з помилкою, якщо будь-який Mach-O всередині пакета застосунку підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти перевірку.

## Використання

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Примітка щодо підписування ad-hoc

Під час підписування з `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматично вимикає **Hardened Runtime** (`--options runtime`). Це необхідно, щоб запобігти аварійним завершенням, коли застосунок намагається завантажити вбудовані фреймворки (наприклад Sparkle), які не мають того самого Team ID. Підписи ad-hoc також порушують збереження дозволів TCC; див. [дозволи macOS](/uk/platforms/mac/permissions) для кроків відновлення.

## Метадані збірки для «Про програму»

`package-mac-app.sh` позначає пакет такими значеннями:

- `OpenClawBuildTimestamp`: ISO8601 UTC на час пакування
- `OpenClawGitCommit`: короткий git-хеш (або `unknown`, якщо недоступно)

Вкладка «Про програму» читає ці ключі, щоб показати версію, дату збірки, git-коміт і чи це налагоджувальна збірка (через `#if DEBUG`). Запустіть пакувальник, щоб оновити ці значення після змін коду.

## Чому

Дозволи TCC прив'язані до ідентифікатора пакета _та_ підпису коду. Непідписані налагоджувальні збірки зі змінними UUID призводили до того, що macOS забувала надані дозволи після кожної повторної збірки. Підписування бінарних файлів (типово ad-hoc) і збереження фіксованого ідентифікатора/шляху пакета (`dist/OpenClaw.app`) зберігає дозволи між збірками, відповідно до підходу VibeTunnel.

## Пов'язане

- [застосунок macOS](/uk/platforms/macos)
- [дозволи macOS](/uk/platforms/mac/permissions)
