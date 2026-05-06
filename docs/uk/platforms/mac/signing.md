---
read_when:
    - Збирання або підписування налагоджувальних збірок Mac
summary: Етапи підписування для налагоджувальних збірок macOS, згенерованих скриптами пакування
title: Підписування для macOS
x-i18n:
    generated_at: "2026-05-06T06:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# підписування mac (збірки для налагодження)

Цю програму зазвичай збирають через [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- задає стабільний ідентифікатор пакета для налагодження: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором пакета (перевизначення через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати основний бінарний файл і пакет програми, аби macOS сприймала кожну повторну збірку як той самий підписаний пакет і зберігала дозволи TCC (сповіщення, доступність, запис екрана, мікрофон, мовлення). Для стабільних дозволів використовуйте справжню ідентичність підписування; ad-hoc є явним вибором і крихкий (див. [дозволи macOS](/uk/platforms/mac/permissions)).
- за замовчуванням використовує `CODESIGN_TIMESTAMP=auto`; це вмикає довірені часові мітки для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити додавання часової мітки (офлайн-збірки для налагодження).
- вставляє метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель «Про програму» могла показувати збірку, git і канал налагодження/релізу.
- **Пакування за замовчуванням використовує Node 24**: скрипт запускає TS-збірки та збірку інтерфейсу керування. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
- зчитує `SIGN_IDENTITY` із середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або ваш сертифікат Developer ID Application) до rc-файлу оболонки, щоб завжди підписувати своїм сертифікатом. Ad-hoc-підписування потребує явного ввімкнення через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендовано для тестування дозволів).
- запускає аудит Team ID після підписування й завершується з помилкою, якщо будь-який Mach-O всередині пакета програми підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти перевірку.

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

Під час підписування з `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматично вимикає **захищене середовище виконання** (`--options runtime`). Це потрібно, щоб запобігти збоям, коли програма намагається завантажити вбудовані фреймворки (наприклад Sparkle), які не мають того самого Team ID. Ad-hoc-підписи також ламають збереження дозволів TCC; див. [дозволи macOS](/uk/platforms/mac/permissions) для кроків відновлення.

## Метадані збірки для «Про програму»

`package-mac-app.sh` позначає пакет такими даними:

- `OpenClawBuildTimestamp`: ISO8601 UTC на час пакування
- `OpenClawGitCommit`: короткий git-хеш (або `unknown`, якщо недоступно)

Вкладка «Про програму» читає ці ключі, щоб показати версію, дату збірки, git-коміт і чи це збірка для налагодження (через `#if DEBUG`). Запустіть пакувальник, щоб оновити ці значення після змін коду.

## Навіщо

Дозволи TCC прив’язані до ідентифікатора пакета _та_ підпису коду. Непідписані збірки для налагодження зі змінними UUID призводили до того, що macOS забувала надані дозволи після кожної повторної збірки. Підписування бінарних файлів (ad-hoc за замовчуванням) і збереження фіксованого ідентифікатора/шляху пакета (`dist/OpenClaw.app`) зберігає дозволи між збірками, як у підході VibeTunnel.

## Пов’язане

- [програма macOS](/uk/platforms/macos)
- [дозволи macOS](/uk/platforms/mac/permissions)
