---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin у реєстрі
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для Skills і plugins OpenClaw.

- Використовуйте вбудовані команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для процесів автентифікації в реєстрі, публікації, видалення/відновлення видаленого та синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Шукайте та встановлюйте plugins за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Встановіть CLI ClawHub, коли потрібні процеси з автентифікацією в реєстрі, як-от
публікація, синхронізація або видалення/відновлення видаленого:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                 | Типова команда                              |
| -------------- | ----------------------------------------------------------- | ------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install <slug>`            |
| Code plugins   | Пакети plugins OpenClaw із метаданими сумісності            | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Упаковані пакети plugins для дистрибуції OpenClaw           | `clawhub package publish <source>`          |
| Souls          | Пакети `SOUL.md`, які показуються на onlycrabs.ai           | Процеси публікації через Web і API          |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканування безпеки. Публічні сторінки показують
поточний стан реєстру, щоб користувачі могли переглянути skill або plugin перед
встановленням.

## Вбудовані процеси OpenClaw

Вбудовані команди OpenClaw встановлюють в активний робочий простір OpenClaw і
зберігають метадані джерела, щоб подальші команди оновлення могли залишатися на
ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися
через ClawHub. Прості npm-сумісні специфікації plugins можуть вирішуватися через
npm під час перехідних запусків, а `npm:<package>` залишається лише для npm, коли
джерело має бути явним.

Встановлення plugins перевіряє заявлену сумісність `pluginApi` і
`minGatewayVersion` до запуску встановлення архіву. Коли версія пакета публікує
артефакт ClawPack, OpenClaw віддає перевагу точно завантаженому npm-pack `.tgz`,
перевіряє заголовок дайджесту ClawHub і завантажені байти, а також записує
метадані артефакту для подальших оновлень.

## CLI ClawHub

CLI ClawHub призначений для роботи з автентифікацією в реєстрі:

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

CLI також має команди встановлення/оновлення Skills для прямих процесів із
реєстром:

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

- `--slug <slug>`: slug skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте plugins із локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без
завантаження, і `--json` для виводу, зручного для CI.

Code plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skills.

## Безпека та модерація

ClawHub за замовчуванням відкритий: будь-хто може завантажувати, але для
публікації потрібен обліковий запис GitHub, достатньо давній, щоб пройти шлюз
завантаження. Публічні сторінки деталей підсумовують останній стан сканування
перед встановленням або завантаженням.

ClawHub запускає автоматизовані перевірки опублікованих Skills і випусків
plugins. Випуски, утримані скануванням або заблоковані, можуть зникати з
публічного каталогу та поверхонь встановлення, залишаючись видимими для свого
власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про Skills і пакети.
Модератори можуть переглядати скарги, приховувати або відновлювати вміст і
блокувати зловживальні облікові записи. Див.
[Прийнятне використання](/uk/clawhub/acceptable-usage) і
[Безпека + модерація](/uk/clawhub/security) для деталей політики та правозастосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний
знімок, щоб ClawHub міг обчислювати кількість встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначити URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначити URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`         | Перевизначити, де CLI зберігає стан token/config. |
| `CLAWHUB_WORKDIR`             | Перевизначити типовий робочий каталог.            |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимкнути телеметрію під час `sync`.               |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
