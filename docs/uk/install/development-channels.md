---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете зафіксувати конкретну версію, тег або SHA
    - Ви тегуєте або публікуєте попередні випуски
sidebarTitle: Release Channels
summary: 'Стабільний, бета- та dev-канали: семантика, перемикання, закріплення та тегування'
title: Канали випуску
x-i18n:
    generated_at: "2026-05-07T13:21:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw постачається в трьох каналах оновлень:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старіший за
  останній стабільний реліз, потік оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для production gateway.

Зазвичай ми спершу постачаємо стабільні збірки в **beta**, тестуємо їх там, а потім запускаємо
явний крок просування, який переміщує перевірену збірку в `latest` без
зміни номера версії. За потреби maintainers також можуть опублікувати стабільний реліз
безпосередньо в `latest`. Dist-tags є джерелом істини для npm
встановлень.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у конфігурації (`update.channel`) і узгоджує
метод встановлення:

- **`stable`** (встановлення пакетів): оновлюється через npm dist-tag `latest`.
- **`beta`** (встановлення пакетів): віддає перевагу npm dist-tag `beta`, але повертається до
  `latest`, коли `beta` відсутній або старіший за поточний стабільний тег.
- **`stable`** (git-встановлення): виконує checkout останнього стабільного git-тега.
- **`beta`** (git-встановлення): віддає перевагу останньому beta git-тегу, але повертається до
  останнього стабільного git-тега, коли beta відсутній або старіший.
- **`dev`**: забезпечує git checkout (типово `~/openclaw`, можна перевизначити через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, виконує rebase на upstream, збирає та
  встановлює глобальний CLI із цього checkout.

<Tip>
Якщо ви хочете мати stable і dev паралельно, тримайте два клони й спрямовуйте свій gateway на стабільний.
</Tip>

## Одноразове націлювання на версію або тег

Використовуйте `--tag`, щоб націлитися на конкретний dist-tag, версію або специфікацію пакета для одного
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

- `--tag` застосовується **лише до пакетних (npm) встановлень**. Git-встановлення ігнорують його.
- Тег не зберігається. Ваш наступний `openclaw update` використовуватиме налаштований
  канал як зазвичай.
- Захист від пониження версії: якщо цільова версія старіша за вашу поточну версію,
  OpenClaw запитає підтвердження (можна пропустити через `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повернутися
  до stable/latest, коли beta відсутній або старіший, тоді як `--tag beta` націлюється на
  сирий dist-tag `beta` для цього одного запуску.

## Пробний запуск

Перегляньте, що зробив би `openclaw update`, без внесення змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Пробний запуск показує ефективний канал, цільову версію, заплановані дії та
чи потрібне було б підтвердження пониження версії.

## Плагіни й канали

Коли ви перемикаєте канали за допомогою `openclaw update`, OpenClaw також синхронізує
джерела плагінів:

- `dev` віддає перевагу bundled plugins із git checkout.
- `stable` і `beta` відновлюють npm-installed plugin packages.
- npm-installed plugins оновлюються після завершення оновлення ядра.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип встановлення (git або package), поточну версію та
джерело (config, git tag, git branch або default).

## Найкращі практики тегування

- Тегуйте релізи, на які мають потрапляти git checkouts (`vYYYY.M.D` для stable,
  `vYYYY.M.D-beta.N` для beta).
- `vYYYY.M.D.beta.N` також розпізнається для сумісності, але віддавайте перевагу `-beta.N`.
- Legacy теги `vYYYY.M.D-<patch>` досі розпізнаються як stable (не beta).
- Тримайте теги незмінними: ніколи не переміщуйте й не використовуйте тег повторно.
- npm dist-tags залишаються джерелом істини для npm встановлень:
  - `latest` -> stable
  - `beta` -> candidate build або beta-first stable build
  - `dev` -> main snapshot (необов’язково)

## Доступність застосунку macOS

Збірки beta й dev можуть **не** включати реліз застосунку macOS. Це нормально:

- Git-тег і npm dist-tag усе одно можна опублікувати.
- Зазначте "no macOS build for this beta" у release notes або changelog.

## Пов’язане

- [Оновлення](/uk/install/updating)
- [Внутрішня будова інсталятора](/uk/install/installer)
