---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin до реєстру
    - Вибір між потоками CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw Skills і plugins.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також установлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення, повторних сканувань і робочих процесів синхронізації.

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

Установіть ClawHub CLI, коли вам потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація, синхронізація, видалення/відновлення або повторні сканування на запит власника:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                 | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install <slug>`             |
| Code plugins   | Пакети plugins OpenClaw з метаданими сумісності              | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Запаковані пакети plugins для дистрибуції OpenClaw           | `clawhub package publish <source>`           |
| Souls          | Пакети `SOUL.md`, що відображаються на onlycrabs.ai          | Робочі процеси публікації через Web і API    |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли перевірити Skill або plugin перед установленням.

## Нативні робочі процеси OpenClaw

Нативні команди OpenClaw установлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися через ClawHub.
Голі npm-сумісні специфікації plugins можуть розв’язуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Установлення plugins перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву. Коли версія пакета публікує артефакт
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
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills з локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: slug Skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте plugins з локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для зручного для CI виводу.

Code plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub за замовчуванням відкритий: завантажувати може будь-хто, але для публікації потрібен GitHub
акаунт, достатньо старий, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед установленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і випусків plugins. Випуски,
утримані скануванням або заблоковані, можуть зникати з публічного каталогу та поверхонь установлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Власники можуть запитувати обмежені повторні сканування для відновлення після хибнопозитивних результатів. Модератори
й адміністратори платформи можуть запитувати повторні сканування для будь-якого Skill або пакета під час обробки
звернень підтримки:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Користувачі, що ввійшли в систему, можуть повідомляти про Skills і пакети. Модератори можуть переглядати звіти,
приховувати або відновлювати вміст, розглядати апеляції та блокувати зловмисні акаунти. Див.
[Прийнятне використання](/uk/clawhub/acceptable-usage) і
[Безпека + модерація](/uk/clawhub/security) для деталей політик і правозастосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний знімок, щоб
ClawHub міг обчислювати кількість установлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає робочий каталог за замовчуванням.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію під час `sync`.                |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
