---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або plugins у реєстрі
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw skills і plugins.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення й оновлення skills, а також для встановлення plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте skills за допомогою OpenClaw:

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

Установіть ClawHub CLI, коли потрібні автентифіковані через реєстр робочі процеси, як-от
публікація, синхронізація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня        | Що зберігає                                               | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install <slug>`             |
| Кодові plugins   | Пакети OpenClaw plugin із метаданими сумісності         | `openclaw plugins install clawhub:<package>` |
| Пакетні plugins | Упаковані набори plugin для дистрибуції OpenClaw            | `clawhub package publish <source>`           |
| Souls          | Пакети `SOUL.md`, що показуються на onlycrabs.ai                      | Робочі процеси публікації через веб і API                    |

ClawHub відстежує semver-версії, теги, як-от `latest`, журнали змін, файли,
завантаження, зірки та зведення сканувань безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли оглянути skill або plugin перед встановленням.

## Нативні робочі процеси OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися через ClawHub.
Голі npm-сумісні специфікації plugin можуть розв’язуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Встановлення plugin перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед запуском встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точному завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти, а також записує метадані артефакту для
подальших оновлень.

## ClawHub CLI

ClawHub CLI призначений для роботи, автентифікованої через реєстр:

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

CLI також має команди встановлення/оновлення skill для прямих робочих процесів із реєстром:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Ці команди встановлюють skills у `./skills` у поточному робочому каталозі
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте skills із локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: slug skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте plugins із локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для зручного для CI виводу.

Кодові plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника команд
і [Формат skill](/uk/clawhub/skill-format) для метаданих skill.

## Безпека й модерація

ClawHub за замовчуванням відкритий: будь-хто може завантажувати, але публікація вимагає GitHub
акаунта достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub запускає автоматизовані перевірки опублікованих skills і випусків plugin. Випуски, утримані скануванням
або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть повідомляти про skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати контент і блокувати зловживальні акаунти. Див.
[Прийнятне використання](/uk/clawhub/acceptable-usage) і
[Безпека + модерація](/uk/clawhub/security) для деталей політик і застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний знімок, щоб
ClawHub міг обчислювати кількість встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                      | Ефект                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, що використовується для входу через браузер.     |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію для `sync`.                      |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
