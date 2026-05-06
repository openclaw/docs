---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете закріпити конкретну версію, тег або SHA
    - Ви створюєте теги або публікуєте попередні випуски
sidebarTitle: Release Channels
summary: 'Стабільний, бета- та dev-канали: семантика, перемикання, закріплення та тегування'
title: Канали випусків
x-i18n:
    generated_at: "2026-05-06T02:09:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw постачається у трьох каналах оновлення:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старіший за
  найновіший стабільний випуск, потік оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для виробничих gateways.

Зазвичай ми спочатку постачаємо стабільні збірки в **beta**, тестуємо їх там, а потім виконуємо
явний крок просування, який переносить перевірену збірку в `latest` без
зміни номера версії. Maintainers також можуть опублікувати стабільний випуск
безпосередньо в `latest`, коли це потрібно. Dist-tags є джерелом істини для npm
інсталяцій.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у конфігурації (`update.channel`) і узгоджує
спосіб інсталяції:

- **`stable`** (пакетні інсталяції): оновлюється через npm dist-tag `latest`.
- **`beta`** (пакетні інсталяції): надає перевагу npm dist-tag `beta`, але повертається до
  `latest`, коли `beta` відсутній або старіший за поточний стабільний tag.
- **`stable`** (git-інсталяції): перемикається на найновіший стабільний git tag.
- **`beta`** (git-інсталяції): надає перевагу найновішому beta git tag, але повертається до
  найновішого стабільного git tag, коли beta відсутній або старіший.
- **`dev`**: забезпечує наявність git checkout (типово `~/openclaw`, можна перевизначити через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, виконує rebase на upstream, збирає та
  інсталює глобальний CLI з цього checkout.

<Tip>
Якщо ви хочете мати stable і dev паралельно, тримайте два clones і спрямуйте свій gateway на stable.
</Tip>

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

- `--tag` застосовується **лише до пакетних (npm) інсталяцій**. Git-інсталяції ігнорують його.
- Tag не зберігається. Наступний `openclaw update` використовує ваш налаштований
  канал, як зазвичай.
- Захист від downgrade: якщо цільова версія старіша за вашу поточну версію,
  OpenClaw запитує підтвердження (пропустіть за допомогою `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повернутися
  до stable/latest, коли beta відсутній або старіший, тоді як `--tag beta` націлюється на
  сирий dist-tag `beta` лише для цього одного запуску.

## Пробний запуск

Перегляньте, що зробив би `openclaw update`, без внесення змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Пробний запуск показує ефективний канал, цільову версію, заплановані дії та
чи потрібне було б підтвердження downgrade.

## Plugins і канали

Коли ви перемикаєте канали за допомогою `openclaw update`, OpenClaw також синхронізує plugin
sources:

- `dev` надає перевагу bundled plugins з git checkout.
- `stable` і `beta` відновлюють npm-installed plugin packages.
- npm-installed plugins оновлюються після завершення оновлення core.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип інсталяції (git або package), поточну версію та
джерело (config, git tag, git branch або default).

## Найкращі практики тегування

- Позначайте releases, на які мають потрапляти git checkouts (`vYYYY.M.D` для stable,
  `vYYYY.M.D-beta.N` для beta).
- `vYYYY.M.D.beta.N` також розпізнається для сумісності, але надавайте перевагу `-beta.N`.
- Застарілі tags `vYYYY.M.D-<patch>` досі розпізнаються як stable (не beta).
- Тримайте tags незмінними: ніколи не переміщуйте й не використовуйте tag повторно.
- npm dist-tags залишаються джерелом істини для npm інсталяцій:
  - `latest` -> stable
  - `beta` -> candidate build або beta-first stable build
  - `dev` -> main snapshot (необов'язково)

## Доступність застосунку macOS

Beta і dev builds можуть **не** містити випуск застосунку macOS. Це нормально:

- Git tag і npm dist-tag усе одно можна опублікувати.
- Зазначте "no macOS build for this beta" у release notes або changelog.

## Пов'язане

- [Оновлення](/uk/install/updating)
- [Внутрішній устрій інсталятора](/uk/install/installer)
