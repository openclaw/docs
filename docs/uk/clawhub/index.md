---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи plugins
    - Публікація Skills або plugins у registry
    - Вибір між CLI-процесами openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, установлення, публікації, безпеки та clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T20:34:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для Skills і плагінів OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати навички та встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/скасування видалення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте й встановлюйте навички за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Шукайте й встановлюйте плагіни за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установіть CLI ClawHub, коли вам потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація або видалення/скасування видалення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                 | Типова команда                              |
| -------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`   |
| Кодові плагіни | Пакети плагінів OpenClaw з метаданими сумісності             | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані набори плагінів для дистрибуції OpenClaw          | `clawhub package publish <source>`         |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканувань безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли перевірити навичку або плагін перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Прості npm-безпечні специфікації плагінів можуть вирішуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm-джерелом, коли джерело має бути явним.

Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точному завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти та записує метадані артефакту для
подальших оновлень.

## CLI ClawHub

CLI ClawHub призначений для роботи, автентифікованої в реєстрі:

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

CLI також має команди встановлення/оновлення навичок для прямих робочих процесів реєстру:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють навички в `./skills` у поточному робочому каталозі
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте навички з локальної теки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: ім’я URL опублікованої навички.
- `--name <name>`: відображуване ім’я.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте плагіни з локальної теки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника команд
і [Формат навички](/clawhub/skill-format) для метаданих навичок.

## Безпека та модерація

ClawHub відкритий за замовчуванням: будь-хто може завантажувати, але для публікації потрібен GitHub
обліковий запис достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки з деталями підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих навичок і релізів плагінів. Релізи, утримані скануванням
або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть повідомляти про навички та пакети. Модератори можуть переглядати повідомлення,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікових записів](/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для деталей політик і правозастосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати best-effort
подію встановлення, щоб ClawHub міг обчислювати агреговані лічильники встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
