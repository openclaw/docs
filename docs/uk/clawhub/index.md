---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи plugins
    - Публікація Skills або plugins у реєстр
    - Вибір між потоками CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, установлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-30T22:33:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр Skills і plugins для OpenClaw.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення Skills, а також для встановлення plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

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

Установіть ClawHub CLI, коли вам потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що вона зберігає                                           | Типова команда                              |
| -------------- | ---------------------------------------------------------- | ------------------------------------------ |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Plugins коду   | Пакети plugins OpenClaw із метаданими сумісності           | `openclaw plugins install clawhub:<package>` |
| Plugins-пакети | Упаковані набори plugins для дистрибуції OpenClaw          | `clawhub package publish <source>`           |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути Skill або plugin перед установленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися через ClawHub.
Прості npm-безпечні специфікації plugins можуть розв’язуватися через npm під час перехідних запусків,
а `npm:<package>` залишається лише npm, коли джерело має бути явним.

Установлення plugins перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед запуском установлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок digest ClawHub і завантажені байти, а також записує метадані артефакта для
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
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills із локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва URL опублікованого Skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами; типово `latest`.

Публікуйте plugins із локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для зручного для CI виводу.

Plugins коду мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/clawhub/skill-format) для метаданих Skills.

## Безпека та модерація

ClawHub відкритий за замовчуванням: будь-хто може завантажувати, але публікація потребує GitHub
акаунта, достатньо старого, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед установленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і випусків plugins. Випуски,
утримані скануванням або заблоковані, можуть зникати з публічного каталогу та поверхонь установлення,
але залишатися видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні акаунти. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека акаунта](/clawhub/moderation) і
[Прийнятне використання](/clawhub/acceptable-usage) для подробиць політик і примусового застосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати подію
встановлення за принципом best-effort, щоб ClawHub міг обчислювати агреговану кількість установлень.
Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту для входу через браузер.   |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
