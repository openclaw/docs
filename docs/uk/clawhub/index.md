---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або Plugin у реєстрі
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр Skills і Plugin для OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати Plugin із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте й встановлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Шукайте й встановлюйте Plugin за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установіть ClawHub CLI, коли вам потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація, синхронізація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігається                                             | Типова команда                               |
| -------------- | ----------------------------------------------------------- | -------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install <slug>`             |
| Code plugins   | Пакети Plugin OpenClaw із метаданими сумісності              | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Запаковані набори Plugin для дистрибуції OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Набори `SOUL.md`, що показуються на onlycrabs.ai             | Потоки публікації через веб і API            |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути Skill або Plugin перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активну робочу область OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення Plugin має виконуватися через ClawHub.
Голі npm-безпечні специфікації Plugin можуть вирішуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Встановлення Plugin перевіряє оголошену сумісність `pluginApi` і `minGatewayVersion`
перед запуском встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти та записує метадані артефакту для
подальших оновлень.

## ClawHub CLI

ClawHub CLI призначений для роботи з автентифікацією в реєстрі:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

CLI також має команди встановлення/оновлення Skill для прямих робочих процесів реєстру:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Ці команди встановлюють Skills у `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills із локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: slug Skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте Plugin із локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для зручного в CI виводу.

Code plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skill.

## Безпека й модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але публікація потребує GitHub
облікового запису достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і релізів Plugin. Релізи, затримані скануванням
або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення, водночас
залишаючись видимими для їхнього власника в `/dashboard`.

Авторизовані користувачі можуть повідомляти про Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Прийнятне використання](/uk/clawhub/acceptable-usage) і
[Безпека + модерація](/uk/clawhub/security) для подробиць політики та застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний знімок, щоб
ClawHub міг обчислювати кількість встановлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                       | Ефект                                             |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`               | Перевизначити URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`           | Перевизначити URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`        | Перевизначити місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`            | Перевизначити стандартний робочий каталог.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимкнути телеметрію для `sync`.                   |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
