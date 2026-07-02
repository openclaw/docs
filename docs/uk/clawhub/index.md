---
read_when:
    - Пояснення того, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи Plugins
    - Публікація Skills або Plugin у реєстрі
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-02T14:10:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для Skills і plugins OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати skills, а також встановлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та процесів видалення/скасування видалення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте skills за допомогою OpenClaw:

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

Встановіть CLI ClawHub, коли потрібні процеси з автентифікацією в реєстрі, як-от
публікація або видалення/скасування видалення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що вона зберігає                                             | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Code plugins   | Пакети plugin OpenClaw із метаданими сумісності              | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Упаковані набори plugin для дистрибуції OpenClaw             | `clawhub package publish <source>`           |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканувань безпеки. Публічні сторінки показують
поточний стан реєстру, щоб користувачі могли переглянути skill або plugin перед
встановленням.

## Нативні процеси OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і
зберігають метадані джерела, щоб подальші команди оновлення могли залишатися на
ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має розв’язуватися
через ClawHub. Голі npm-сумісні специфікації plugin можуть розв’язуватися через
npm під час перехідних етапів запуску, а `npm:<package>` залишається лише npm,
коли джерело має бути явним.

Встановлення plugin перевіряє заявлену сумісність `pluginApi` і
`minGatewayVersion` перед запуском встановлення архіву. Коли версія пакета
публікує артефакт ClawPack, OpenClaw надає перевагу точно завантаженому
npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і завантажені байти та
записує метадані артефакту для подальших оновлень.

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

CLI також має команди встановлення/оновлення skills для прямих процесів із реєстром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють skills у `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте skills із локальної теки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва URL опублікованого skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, типово `latest`.

Публікуйте plugins із локальної теки, `owner/repo`, `owner/repo@ref` або URL
GitHub:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження,
і `--json` для виводу, зручного для CI.

Code plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повної довідки
команд і [Формат skill](/clawhub/skill-format) для метаданих skill.

## Безпека та модерація

ClawHub відкритий за замовчуванням: будь-хто може завантажувати, але публікація
потребує облікового запису GitHub, достатньо старого, щоб пройти шлюз завантаження.
Публічні сторінки деталей підсумовують найновіший стан сканування перед
встановленням або завантаженням.

ClawHub запускає автоматизовані перевірки опублікованих skills і випусків plugin.
Випуски, утримані скануванням або заблоковані, можуть зникати з публічного каталогу
та поверхонь встановлення, залишаючись видимими для свого власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть повідомляти про skills і пакети.
Модератори можуть переглядати скарги, приховувати або відновлювати вміст і
блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікового запису](/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для деталей політик і
застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install` після входу в систему, CLI може надіслати
подію встановлення в режимі найкращого зусилля, щоб ClawHub міг обчислювати
сукупну кількість встановлень. Вимкніть це за допомогою:

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
