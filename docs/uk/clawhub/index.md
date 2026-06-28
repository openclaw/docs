---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи плагінів
    - Публікація Skills або Plugin до реєстру
    - Вибір між потоками CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T20:41:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw Skills і plugins.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/скасування видалення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Шукайте та встановлюйте plugins за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Встановіть CLI ClawHub, коли потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація або видалення/скасування видалення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                  | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Кодові plugins | Пакети plugins OpenClaw з метаданими сумісності              | `openclaw plugins install clawhub:<package>` |
| Пакетні plugins | Упаковані пакети plugins для дистрибуції OpenClaw           | `clawhub package publish <source>`           |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення перевірок безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути skill або plugin перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися через ClawHub.
Прості npm-безпечні специфікації plugins можуть вирішуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Встановлення plugins перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед встановленням архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw віддає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти та записує метадані артефакту для
подальших оновлень.

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
```

CLI також має команди встановлення/оновлення Skills для прямих робочих процесів реєстру:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

- `--slug <slug>`: URL-ім’я опублікованого skill.
- `--name <name>`: відображуване ім’я.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте plugins із локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника команд
і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skills.

## Безпека та модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але публікація потребує облікового запису GitHub
достатньо старого, щоб пройти шлюз завантаження. Публічні сторінки деталей узагальнюють
останній стан перевірки перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і випусків plugins. Випуски,
утримані скануванням або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення, але
залишатися видимими для їхнього власника в `/dashboard`.

Авторизовані користувачі можуть скаржитися на Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/uk/clawhub/security-audits),
[Модерація та безпека облікового запису](/uk/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для подробиць політик і застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, будучи авторизованими, CLI може надіслати best-effort
подію встановлення, щоб ClawHub міг обчислювати агреговані лічильники встановлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначити URL сайту, який використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначити URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`         | Перевизначити, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначити робочий каталог за замовчуванням.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимкнути телеметрію встановлення.                 |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
