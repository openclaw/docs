---
read_when:
    - Збирання або підписування debug-збірок macOS
summary: Кроки підписування для debug-збірок macOS, згенерованих скриптами пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-04-23T21:01:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 562f4a9541473eaf9bc9d1a01cb1a1a0e4bde48418ee2cece455614596f99dc6
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Підписування mac (debug-збірки)

Цей застосунок зазвичай збирається через [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- задає стабільний ідентифікатор debug bundle: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором bundle (можна перевизначити через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати основний бінарний файл і bundle застосунку, аби macOS сприймала кожну повторну збірку як той самий підписаний bundle і зберігала дозволи TCC (сповіщення, accessibility, screen recording, мікрофон, speech). Для стабільних дозволів використовуйте справжню identity підписування; ad-hoc — це opt-in і ненадійний варіант (див. [macOS permissions](/uk/platforms/mac/permissions)).
- типово використовує `CODESIGN_TIMESTAMP=auto`; це вмикає довірені часові мітки для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити проставлення часових міток (офлайн debug-збірки).
- впроваджує метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель About могла показувати збірку, git і канал debug/release.
- **Пакування типово використовує Node 24**: скрипт запускає збирання TS і збирання Control UI. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
- читає `SIGN_IDENTITY` із середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або ваш сертифікат Developer ID Application) до rc-файла оболонки, щоб завжди підписувати своїм сертифікатом. Ad-hoc-підписування потребує явної згоди через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендовано для тестування дозволів).
- після підписування запускає аудит Team ID і завершується помилкою, якщо будь-який Mach-O всередині bundle застосунку підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти цю перевірку.

## Використання

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Примітка щодо ad-hoc-підписування

Коли підписування виконується з `SIGN_IDENTITY="-"` (ad-hoc), скрипт автоматично вимикає **Hardened Runtime** (`--options runtime`). Це потрібно, щоб запобігти аваріям, коли застосунок намагається завантажити вбудовані frameworks (наприклад, Sparkle), які не мають того самого Team ID. Ad-hoc-підписи також руйнують сталість дозволів TCC; кроки відновлення див. у [macOS permissions](/uk/platforms/mac/permissions).

## Метадані збірки для About

`package-mac-app.sh` додає до bundle:

- `OpenClawBuildTimestamp`: ISO8601 UTC на момент пакування
- `OpenClawGitCommit`: короткий хеш git (або `unknown`, якщо недоступно)

Вкладка About читає ці ключі, щоб показувати версію, дату збірки, коміт git і те, чи це debug-збірка (через `#if DEBUG`). Запускайте пакувальник, щоб оновити ці значення після змін у коді.

## Навіщо

Дозволи TCC прив’язані до ідентифікатора bundle _і_ підпису коду. Непідписані debug-збірки зі змінними UUID призводили до того, що macOS забувала надані дозволи після кожної повторної збірки. Підписування бінарних файлів (типово ad-hoc) і збереження фіксованого id/path bundle (`dist/OpenClaw.app`) зберігає дозволи між збірками, повторюючи підхід VibeTunnel.
