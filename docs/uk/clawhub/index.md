---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи плагінів
    - Публікація Skills або плагінів у реєстрі
    - Вибір між сценаріями CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: 'Загальнодоступний огляд ClawHub: пошук, установлення, публікація, безпека та CLI clawhub.'
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T17:35:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр Skills і плагінів OpenClaw.

- Використовуйте вбудовані команди `openclaw`, щоб шукати, установлювати й оновлювати Skills, а також установлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та операцій видалення й відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий початок

Шукайте й установлюйте Skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Шукайте й установлюйте плагіни за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Установіть CLI ClawHub, коли потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація або видалення й відновлення:

```bash
npm i -g clawhub
# або
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Розділ          | Що в ньому зберігається                                      | Типова команда                               |
| --------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills          | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Плагіни коду    | Пакети плагінів OpenClaw із метаданими сумісності            | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані набори плагінів для розповсюдження OpenClaw       | `clawhub package publish <source>`           |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення результатів перевірок безпеки. На публічних сторінках відображається поточний
стан реєстру, щоб користувачі могли перевірити Skill або плагін перед установленням.

## Вбудовані робочі процеси OpenClaw

Вбудовані команди OpenClaw установлюють компоненти в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли й надалі використовувати ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Специфікації плагінів без префікса, сумісні з npm, можуть оброблятися через npm під час перехідного запуску, а
`npm:<package>` використовує лише npm, коли джерело потрібно вказати явно.

Під час установлення плагінів перевіряється заявлена сумісність із `pluginApi` і `minGatewayVersion`
до початку встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-пакету `.tgz`, перевіряє
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

CLI також має команди встановлення й оновлення Skills для безпосередніх робочих процесів із реєстром:

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

- `--slug <slug>`: назва в URL опублікованого Skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: розділені комами теги; типове значення — `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або URL-адреси
GitHub:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб створити точний план публікації без завантаження, і `--json`
для виведення, зручного для CI.

Плагіни коду повинні містити обов’язкові метадані сумісності з OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Повний опис команд див. у розділі [CLI](/uk/clawhub/cli),
а метадані Skills — у розділі [Формат Skill](/clawhub/skill-format).

## Безпека й модерація

ClawHub за замовчуванням відкритий: завантажувати може будь-хто, але для публікації потрібен обліковий запис
GitHub, достатньо давній, щоб пройти перевірку для завантаження. На публічних сторінках відомостей перед установленням
або завантаженням наводиться зведення останнього стану перевірки.

ClawHub виконує автоматизовані перевірки опублікованих Skills і випусків плагінів. Випуски,
затримані перевіркою або заблоковані, можуть зникнути з публічного каталогу й інтерфейсів установлення,
але залишатися видимими їхньому власнику в `/dashboard`.

Користувачі, які ввійшли в систему, можуть скаржитися на Skills і пакети. Модератори можуть розглядати скарги,
приховувати або відновлювати вміст і блокувати облікові записи порушників. Докладніше про політики та їх застосування див. у розділах
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікових записів](/clawhub/moderation) і
[Прийнятне використання](/clawhub/acceptable-usage).

## Телеметрія та середовище

Коли команда `clawhub install` виконується після входу в систему, CLI може за можливості надіслати
подію встановлення, щоб ClawHub міг обчислювати сукупну кількість установлень. Щоб вимкнути це, виконайте:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення змінних середовища:

| Змінна                       | Дія                                               |
| ---------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту для входу через браузер.   |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце зберігання токена й стану конфігурації CLI. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Докладнішу довідкову інформацію див. у розділах [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting).
