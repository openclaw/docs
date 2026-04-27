---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете зафіксувати конкретну версію, тег або SHA
    - Ви тегуєте або публікуєте prerelease-випуски
sidebarTitle: Release Channels
summary: 'Канали stable, beta і dev: семантика, перемикання, фіксація версій і тегування'
title: Канали випусків
x-i18n:
    generated_at: "2026-04-27T06:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 15
---

# Канали розробки

OpenClaw постачається з трьома каналами оновлень:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старіший за
  останній stable-випуск, процес оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для production gateway.

Зазвичай ми спочатку випускаємо stable-збірки в **beta**, тестуємо їх там, а потім виконуємо
явний крок просування, який переміщує перевірену збірку до `latest` без
зміни номера версії. Супроводжувачі також можуть за потреби опублікувати stable-випуск
безпосередньо в `latest`. Dist-tags є джерелом істини для встановлень через npm.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у конфігурації (`update.channel`) і вирівнює
спосіб встановлення:

- **`stable`** (встановлення пакета): оновлення через npm dist-tag `latest`.
- **`beta`** (встановлення пакета): надає перевагу npm dist-tag `beta`, але повертається до
  `latest`, якщо `beta` відсутній або старіший за поточний stable-тег.
- **`stable`** (встановлення через git): перемикається на останній stable git-тег.
- **`beta`** (встановлення через git): надає перевагу останньому beta git-тегу, але повертається до
  останнього stable git-тегу, якщо beta відсутній або старіший.
- **`dev`**: забезпечує git checkout (типово `~/openclaw`, можна перевизначити через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, робить rebase з upstream, збирає і
  встановлює глобальний CLI з цього checkout.

<Tip>
Якщо ви хочете stable і dev паралельно, тримайте дві копії репозиторію й спрямуйте свій gateway на stable-копію.
</Tip>

## Одноразове націлення на версію або тег

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

- `--tag` застосовується **лише до встановлень пакета (npm)**. Встановлення через git його ігнорують.
- Тег не зберігається. Наступний `openclaw update` використовує ваш налаштований
  канал, як зазвичай.
- Захист від пониження версії: якщо цільова версія старіша за поточну,
  OpenClaw запитує підтвердження (пропустити можна через `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повернутися
  до stable/latest, якщо beta відсутній або старіший, тоді як `--tag beta` націлюється на
  сирий dist-tag `beta` лише для цього одного запуску.

## Пробний запуск

Перегляньте, що зробить `openclaw update`, не вносячи змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Пробний запуск показує ефективний канал, цільову версію, заплановані дії та
чи буде потрібне підтвердження пониження версії.

## Plugin і канали

Коли ви перемикаєте канали через `openclaw update`, OpenClaw також синхронізує
джерела Plugin:

- `dev` надає перевагу вбудованим Plugin з git checkout.
- `stable` і `beta` відновлюють npm-встановлені пакети Plugin.
- npm-встановлені Plugin оновлюються після завершення оновлення core.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип встановлення (git або package), поточну версію та
джерело (конфігурація, git-тег, git-гілка або типове значення).

## Рекомендації щодо тегування

- Тегуйте випуски, на які мають потрапляти git checkout (`vYYYY.M.D` для stable,
  `vYYYY.M.D-beta.N` для beta).
- `vYYYY.M.D.beta.N` також розпізнається для сумісності, але надавайте перевагу `-beta.N`.
- Застарілі теги `vYYYY.M.D-<patch>` усе ще розпізнаються як stable (не-beta).
- Зберігайте теги незмінними: ніколи не переміщуйте й не використовуйте тег повторно.
- npm dist-tags залишаються джерелом істини для встановлень через npm:
  - `latest` -> stable
  - `beta` -> кандидатна збірка або stable-збірка, спочатку випущена в beta
  - `dev` -> знімок `main` (необов’язково)

## Доступність програми для macOS

Beta і dev-збірки можуть **не** містити випуск програми для macOS. Це нормально:

- git-тег і npm dist-tag усе одно можуть бути опубліковані.
- Уточнюйте «немає збірки для macOS для цієї beta» у примітках до випуску або changelog.

## Пов’язане

- [Оновлення](/uk/install/updating)
- [Внутрішня будова встановлювача](/uk/install/installer)
