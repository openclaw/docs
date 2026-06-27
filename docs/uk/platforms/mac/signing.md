---
read_when:
    - Створення або підписування налагоджувальних збірок для Mac
summary: Етапи підписування для налагоджувальних збірок macOS, згенерованих скриптами пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-06-27T17:47:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# підписування mac (налагоджувальні збірки)

Цей застосунок зазвичай збирається з [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- задає стабільний ідентифікатор налагоджувального бандла: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором бандла (перевизначення через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати основний виконуваний файл і бандл застосунку, щоб macOS розглядала кожну повторну збірку як той самий підписаний бандл і зберігала дозволи TCC (сповіщення, доступність, запис екрана, мікрофон, мовлення). Для стабільних дозволів використовуйте справжню ідентичність підписування; ad-hoc є opt-in і крихкий (див. [дозволи macOS](/uk/platforms/mac/permissions)).
- використовує `CODESIGN_TIMESTAMP=auto` за замовчуванням; це вмикає довірені часові позначки для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити додавання часової позначки (офлайн-налагоджувальні збірки).
- впроваджує метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель About могла показувати збірку, git і канал debug/release.
- **Пакування за замовчуванням використовує Node 24**: скрипт запускає TS-збірки та збірку Control UI. Node 22 LTS, наразі `22.19+`, і надалі підтримується для сумісності.
- читає `SIGN_IDENTITY` із середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або ваш сертифікат Developer ID Application) до shell rc, щоб завжди підписувати своїм сертифікатом. Підписування ad-hoc потребує явного opt-in через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендовано для тестування дозволів).
- запускає аудит Team ID після підписування й завершується з помилкою, якщо будь-який Mach-O всередині бандла застосунку підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти.

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

Під час підписування з `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматично вимикає **Hardened Runtime** (`--options runtime`). Це необхідно, щоб запобігти аварійним завершенням, коли застосунок намагається завантажити вбудовані фреймворки (наприклад Sparkle), які не мають того самого Team ID. Підписи ad-hoc також порушують сталість дозволів TCC; див. [дозволи macOS](/uk/platforms/mac/permissions), щоб дізнатися про кроки відновлення.

## Метадані збірки для About

`package-mac-app.sh` ставить на бандл такі позначки:

- `OpenClawBuildTimestamp`: ISO8601 UTC під час пакування
- `OpenClawGitCommit`: короткий git-хеш (або `unknown`, якщо недоступно)

Вкладка About читає ці ключі, щоб показати версію, дату збірки, git-коміт і чи це налагоджувальна збірка (через `#if DEBUG`). Запустіть пакувальник, щоб оновити ці значення після змін у коді.

## Чому

Дозволи TCC прив'язані до ідентифікатора бандла _та_ підпису коду. Непідписані налагоджувальні збірки зі змінними UUID призводили до того, що macOS забувала надані дозволи після кожної повторної збірки. Підписування двійкових файлів (ad-hoc за замовчуванням) і збереження фіксованого ідентифікатора/шляху бандла (`dist/OpenClaw.app`) зберігає дозволи між збірками, відповідно до підходу VibeTunnel.

## Пов’язане

- [застосунок macOS](/uk/platforms/macos)
- [дозволи macOS](/uk/platforms/mac/permissions)
