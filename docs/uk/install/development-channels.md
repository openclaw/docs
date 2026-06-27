---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете закріпити конкретну версію, тег або SHA
    - Ви позначаєте або публікуєте попередні випуски
sidebarTitle: Release Channels
summary: 'Стабільний, beta і dev канали: семантика, перемикання, закріплення та тегування'
title: Канали випусків
x-i18n:
    generated_at: "2026-06-27T17:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw постачається з трьома каналами оновлень:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старіший за
  останній стабільний випуск, потік оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для production gateways.

Зазвичай ми спершу постачаємо стабільні збірки в **beta**, тестуємо їх там, а потім запускаємо
явний крок просування, який переносить перевірену збірку до `latest` без
зміни номера версії. Мейнтейнери також можуть опублікувати стабільний випуск
безпосередньо в `latest`, коли це потрібно. Dist-tags є джерелом істини для встановлень npm.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у конфігурації (`update.channel`) і узгоджує
метод встановлення:

- **`stable`** (встановлення пакетів): оновлення через npm dist-tag `latest`.
- **`beta`** (встановлення пакетів): надає перевагу npm dist-tag `beta`, але повертається до
  `latest`, коли `beta` відсутній або старіший за поточний стабільний тег.
- **`stable`** (встановлення з git): переходить на останній стабільний git-тег, виключаючи
  semver prerelease-теги, як-от `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` та інші prerelease-
  суфікси.
- **`beta`** (встановлення з git): надає перевагу останньому beta git-тегу, але повертається до
  останнього стабільного git-тегу, коли beta відсутній або старіший.
- **`dev`**: забезпечує git checkout (типово `~/openclaw` або
  `$OPENCLAW_HOME/openclaw`, коли встановлено `OPENCLAW_HOME`; перевизначте через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, виконує rebase на upstream, збирає та
  встановлює глобальний CLI з цього checkout.

<Tip>
Якщо ви хочете мати stable і dev паралельно, тримайте два клони й спрямовуйте свій gateway на стабільний.
</Tip>

## Одноразове націлювання на версію або тег

Використовуйте `--tag`, щоб націлитися на певний dist-tag, версію або специфікацію пакета для одного
оновлення **без** зміни вашого збереженого каналу:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Примітки:

- `--tag` застосовується **лише до встановлень пакетів (npm)**. Встановлення з git ігнорують його.
- Тег не зберігається. Ваш наступний `openclaw update` використовує налаштований
  канал, як зазвичай.
- Для встановлень пакетів OpenClaw попередньо пакує специфікації джерела GitHub/git у
  тимчасовий tarball перед staged npm install. Використовуйте `--channel dev` або
  `--install-method git --version main`, коли вам потрібен рухомий checkout `main`
  як постійне встановлення.
- Захист від downgrade: якщо цільова версія старіша за вашу поточну версію,
  OpenClaw запитує підтвердження (пропустіть за допомогою `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повернутися
  до stable/latest, коли beta відсутній або старіший, тоді як `--tag beta` націлюється на
  сирий dist-tag `beta` для цього одного запуску.

## Dry run

Попередньо перегляньте, що зробив би `openclaw update`, без внесення змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run показує ефективний канал, цільову версію, заплановані дії та
чи потрібне підтвердження downgrade.

## Plugins і канали

Коли ви перемикаєте канали за допомогою `openclaw update`, OpenClaw також синхронізує джерела plugin:

- `dev` надає перевагу bundled plugins із git checkout.
- `stable` і `beta` відновлюють встановлені через npm packages plugin.
- Встановлені через npm plugins оновлюються після завершення оновлення ядра.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип встановлення (git або package), поточну версію та
джерело (config, git tag, git branch або default).

## Найкращі практики тегування

- Позначайте тегами випуски, на які мають потрапляти git checkouts (`vYYYY.M.PATCH` для stable,
  `vYYYY.M.PATCH-beta.N` для beta; іменовані semver prerelease-суфікси, як-от
  `-alpha.N`, `-rc.N` і `-next.N`, не є стабільними цілями).
- Застарілі числові stable-теги, як-от `vYYYY.M.PATCH-1` і `v1.0.1-1`, усе ще
  розпізнаються як стабільні git-теги для сумісності.
- `vYYYY.M.PATCH.beta.N` також розпізнається для сумісності, але надавайте перевагу `-beta.N`.
- Зберігайте теги незмінними: ніколи не переміщуйте й не використовуйте тег повторно.
- npm dist-tags залишаються джерелом істини для встановлень npm:
  - `latest` -> stable
  - `beta` -> кандидатна збірка або beta-first stable build
  - `dev` -> main snapshot (необов’язково)

## Доступність застосунку macOS

Beta- і dev-збірки можуть **не** містити випуску застосунку macOS. Це нормально:

- Git-тег і npm dist-tag усе одно можуть бути опубліковані.
- Зазначте "немає збірки macOS для цієї beta" в нотатках до випуску або changelog.

## Пов’язане

- [Оновлення](/uk/install/updating)
- [Внутрішня робота інсталятора](/uk/install/installer)
