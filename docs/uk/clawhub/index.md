---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи Plugin
    - Публікація Skills або plugins у реєстрі
    - Вибір між CLI-сценаріями openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-05-13T04:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw Skills і плагінів.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення Skills, а також для встановлення плагінів із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/скасування видалення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Шукайте та встановлюйте плагіни за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Встановіть ClawHub CLI, коли вам потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація, синхронізація або видалення/скасування видалення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня        | Що зберігає                                               | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install <slug>`             |
| Кодові плагіни   | Пакети плагінів OpenClaw із метаданими сумісності         | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані пакети плагінів для дистрибуції OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Пакети `SOUL.md`, що показуються на onlycrabs.ai                      | Потоки публікації через Web і API                    |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути Skill або плагін перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Прості npm-безпечні специфікації плагінів можуть розв’язуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед встановленням архіву. Коли версія пакета публікує артефакт ClawPack, OpenClaw віддає перевагу
точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і завантажені байти, а також записує метадані артефакта для
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
clawhub sync --all
```

CLI також має команди встановлення/оновлення Skills для прямих робочих процесів із реєстром:

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
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами; типово `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для зручного для CI виводу.

Кодові плагіни мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub за замовчуванням відкритий: будь-хто може завантажувати, але для публікації потрібен GitHub
акаунт достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки деталей узагальнюють
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і релізів плагінів. Утримані скануванням
або заблоковані релізи можуть зникати з публічного каталогу та поверхонь встановлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть скаржитися на Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні акаунти. Див.
[Прийнятне використання](/uk/clawhub/acceptable-usage) і
[Безпека + модерація](/uk/clawhub/security) для деталей політики та застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний знімок, щоб
ClawHub міг обчислювати кількість встановлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                      | Ефект                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, який використовується для входу через браузер.     |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.                      |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
