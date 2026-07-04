---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, інсталяція або оновлення Skills чи plugins
    - Публікація Skills або Plugin у реєстрі
    - Вибір між CLI-потоками openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T04:04:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для Skills і плагінів OpenClaw.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення Skills, а також для встановлення плагінів із ClawHub.
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

Установіть ClawHub CLI, коли вам потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                     | Типова команда                              |
| -------------- | --------------------------------------------------------------- | ------------------------------------------- |
| Skills         | Версійовані текстові набори з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`    |
| Кодові плагіни | Пакети плагінів OpenClaw із метаданими сумісності              | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Упаковані набори плагінів для дистрибуції OpenClaw             | `clawhub package publish <source>`          |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли перевірити Skill або плагін перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Прості npm-безпечні специфікації плагінів можуть виконуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише для npm, коли джерело потрібно вказати явно.

Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти та записує метадані артефакта для
подальших оновлень.

## ClawHub CLI

ClawHub CLI призначений для автентифікованої роботи з реєстром:

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

CLI також має команди встановлення/оновлення Skills для прямих робочих процесів реєстру:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють Skills у `./skills` у поточному робочому каталозі
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills із локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва опублікованого URL Skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами; типово `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або URL
GitHub:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повної довідки
команд і [Формат Skill](/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub типово відкритий: будь-хто може завантажувати, але публікація потребує облікового запису GitHub,
достатньо старого, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і релізів плагінів. Релізи,
затримані скануванням або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення,
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть скаржитися на Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікового запису](/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для подробиць політики та застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install` після входу в систему, CLI може надіслати подію
встановлення за принципом найкращих зусиль, щоб ClawHub міг обчислювати агреговану кількість встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, який використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
