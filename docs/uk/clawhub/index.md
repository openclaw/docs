---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або plugins у реєстр
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T02:54:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw Skills і плагінів.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Шукайте та встановлюйте плагіни за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Встановіть ClawHub CLI, коли потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                | Типова команда                              |
| -------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Skills         | Версійовані текстові пакети з `SKILL.md` і супровідними файлами | `openclaw skills install @openclaw/demo`   |
| Кодові плагіни | Пакети плагінів OpenClaw з метаданими сумісності           | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані пакети плагінів для дистрибуції OpenClaw        | `clawhub package publish <source>`         |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути Skill або плагін перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють у активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Голі npm-сумісні специфікації плагінів можуть визначатися через npm під час перехідних періодів запуску, а
`npm:<package>` залишається лише для npm, коли джерело має бути явним.

Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед запуском встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw віддає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
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
```

CLI також має команди встановлення/оновлення Skills для прямих робочих процесів із реєстром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють Skills у `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills з локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: ім'я Skill в URL після публікації.
- `--name <name>`: відображуване ім'я.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити обов'язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але для публікації потрібен обліковий запис GitHub,
достатньо старий, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і релізів плагінів. Релізи, утримані
скануванням або заблоковані, можуть зникнути з публічного каталогу й поверхонь встановлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікового запису](/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для деталей політик і застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати best-effort
подію встановлення, щоб ClawHub міг обчислювати агреговані лічильники встановлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
