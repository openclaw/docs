---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете зафіксувати конкретну версію, tag або SHA
    - Ви тегуєте або публікуєте prerelease-версії
sidebarTitle: Release Channels
summary: 'Stable-, beta- та dev-канали: семантика, перемикання, pinning і tagging'
title: Канали випусків
x-i18n:
    generated_at: "2026-04-23T20:56:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70e8f57fb68143ded6bb58967925ec3d222df5728792353e974292daf442e0c
    source_path: install/development-channels.md
    workflow: 15
---

# Канали розробки

OpenClaw постачається з трьома каналами оновлень:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старший
  за останній stable-випуск, потік оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для production Gateway.

Зазвичай ми спочатку випускаємо stable-збірки в **beta**, тестуємо їх там, а потім виконуємо
явний крок просування, який переносить перевірену збірку до `latest` без
зміни номера версії. Супровідники також можуть за потреби публікувати stable-випуск
безпосередньо в `latest`. Dist-tags є джерелом істини для встановлень npm.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у config (`update.channel`) і узгоджує
метод встановлення:

- **`stable`** (package installs): оновлення через npm dist-tag `latest`.
- **`beta`** (package installs): надає перевагу npm dist-tag `beta`, але повертається до
  `latest`, коли `beta` відсутній або старший за поточний stable tag.
- **`stable`** (git installs): переходить на останній stable git tag.
- **`beta`** (git installs): надає перевагу останньому beta git tag, але повертається до
  останнього stable git tag, коли beta відсутній або старший.
- **`dev`**: забезпечує git-checkout (типово `~/openclaw`, можна перевизначити через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, виконує rebase з upstream, збирає та
  встановлює глобальний CLI з цього checkout.

Порада: якщо ви хочете мати stable + dev паралельно, тримайте два clone і спрямовуйте
свій gateway на stable-копію.

## Разове націлювання на версію або tag

Використовуйте `--tag`, щоб націлитися на конкретний dist-tag, версію або package spec для одного
оновлення **без** зміни збереженого каналу:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Примітки:

- `--tag` застосовується **лише до package (npm) installs**. Git-встановлення його ігнорують.
- Tag не зберігається. Наступний `openclaw update` використовуватиме ваш налаштований
  канал, як зазвичай.
- Захист від downgrade: якщо цільова версія старіша за поточну версію,
  OpenClaw запитує підтвердження (пропустити можна через `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повертатися
  до stable/latest, коли beta відсутній або старший, тоді як `--tag beta` націлюється на
  необроблений dist-tag `beta` лише для цього одного запуску.

## Dry run

Попередньо перегляньте, що зробить `openclaw update`, не вносячи змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run показує ефективний канал, цільову версію, заплановані дії та
чи потрібне підтвердження downgrade.

## Plugins і канали

Коли ви перемикаєте канали через `openclaw update`, OpenClaw також синхронізує
джерела plugin:

- `dev` надає перевагу вбудованим plugins із git-checkout.
- `stable` і `beta` відновлюють npm-встановлені пакети plugin.
- npm-встановлені plugins оновлюються після завершення оновлення core.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип встановлення (git або package), поточну версію та
джерело (config, git tag, git branch або типове значення).

## Найкращі практики тегування

- Тегуйте випуски, на які мають переходити git-checkout (`vYYYY.M.D` для stable,
  `vYYYY.M.D-beta.N` для beta).
- `vYYYY.M.D.beta.N` також розпізнається для сумісності, але віддавайте перевагу `-beta.N`.
- Старі теги `vYYYY.M.D-<patch>` усе ще розпізнаються як stable (не-beta).
- Зберігайте теги незмінними: ніколи не пересувайте і не використовуйте tag повторно.
- npm dist-tags залишаються джерелом істини для npm-встановлень:
  - `latest` -> stable
  - `beta` -> кандидатна збірка або stable-збірка, спочатку випущена в beta
  - `dev` -> snapshot `main` (необов’язково)

## Доступність застосунку macOS

Beta- і dev-збірки можуть **не** включати випуск застосунку macOS. Це нормально:

- Git tag і npm dist-tag усе одно можуть бути опубліковані.
- У примітках до випуску або changelog зазначайте "no macOS build for this beta".
