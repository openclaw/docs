---
read_when:
    - Ви хочете знати, що означає npm shrinkwrap у релізі OpenClaw
    - Ви перевіряєте lock-файли пакетів, зміни залежностей або ризики ланцюга постачання
    - Ви перевіряєте кореневі або Plugin-пакети npm перед публікацією
summary: Пояснення простою мовою та технічне пояснення npm shrinkwrap у релізах OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Робочі копії вихідного коду OpenClaw використовують `pnpm-lock.yaml`. Опубліковані npm-пакети OpenClaw використовують `npm-shrinkwrap.json`, публіковний lockfile залежностей npm, тож встановлення пакета використовує граф залежностей, перевірений під час релізу.

## Спрощена версія

Shrinkwrap — це квитанція для дерева залежностей, яке постачається з npm-пакетом.
Він указує npm, які саме версії транзитивних пакетів установлювати.

Для релізів OpenClaw це означає:

- опублікований пакет не просить npm створювати свіжий граф залежностей під час
  встановлення;
- зміни залежностей легше перевіряти, бо вони з’являються в lockfile;
- валідація релізу може тестувати той самий граф, який встановлюватимуть користувачі;
- несподіванки з розміром пакета або нативними залежностями легше помітити до
  публікації.

Shrinkwrap — це не пісочниця. Він сам собою не робить залежність безпечною і
не замінює ізоляцію хоста, `openclaw security audit`, походження пакетів або
smoke-тести встановлення.

Коротка ментальна модель:

| Файл                  | Де він має значення               | Що це означає                         |
| --------------------- | --------------------------------- | ------------------------------------- |
| `pnpm-lock.yaml`      | Робоча копія вихідного коду OpenClaw | Граф залежностей для супровідників |
| `npm-shrinkwrap.json` | Опублікований npm-пакет           | Граф встановлення npm для користувачів |
| `package-lock.json`   | Локальні npm-застосунки           | Не контракт публікації OpenClaw       |

## Чому OpenClaw використовує його

OpenClaw — це Gateway, хост Plugin, маршрутизатор моделей і runtime агента. Типове
встановлення може впливати на час запуску, використання диска, завантаження
нативних пакетів і ризики ланцюга постачання.

Shrinkwrap дає перевірці релізу стабільну межу:

- рецензенти можуть бачити рух транзитивних залежностей;
- валідатори пакетів можуть відхиляти неочікуване зміщення lockfile;
- приймання пакета може тестувати встановлення з графом, який буде постачатися;
- пакети Plugin можуть нести власний зафіксований граф залежностей замість того,
  щоб покладатися на кореневий пакет для володіння залежностями, потрібними лише Plugin.

Мета — не «більше lockfile». Мета — відтворювані релізні встановлення з чітким
володінням.

## Технічні деталі

Кореневий npm-пакет `openclaw` і npm-пакети Plugin, якими володіє OpenClaw,
містять `npm-shrinkwrap.json` під час публікації. Відповідні пакети Plugin,
якими володіє OpenClaw, також можуть публікуватися з явними
`bundledDependencies`, щоб їхні runtime-файли залежностей переносилися в tarball
Plugin, а не залежали лише від розв’язання під час встановлення.

Підтримуйте межу так:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Генератор розв’язує публіковний формат lock для npm, але відхиляє згенеровані
версії пакетів, яких ще немає в `pnpm-lock.yaml`. Це зберігає межу віку
залежностей pnpm, override і перевірки patch.

Використовуйте команди лише для кореня тільки тоді, коли навмисно оновлюєте
кореневий пакет, не торкаючись пакетів Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Перевіряйте ці файли як чутливі з погляду безпеки:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload-и залежностей bundled Plugin
- будь-який diff `package-lock.json`

Валідатори пакетів OpenClaw вимагають shrinkwrap у нових tarball-ах кореневого
пакета. Шлях публікації npm для Plugin перевіряє локальний shrinkwrap Plugin,
встановлює локальні bundled-залежності пакета, а потім пакує або публікує.
Валідатори пакетів відхиляють `package-lock.json` для опублікованих пакетів
OpenClaw.

Щоб перевірити опублікований кореневий пакет:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Щоб перевірити пакет Plugin, яким володіє OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Довідково: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
