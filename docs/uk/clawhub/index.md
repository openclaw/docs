---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи плагінів
    - Публікація Skills або плагінів у реєстрі
    - Вибір між процесами CLI OpenClaw і ClawHub
sidebarTitle: ClawHub
summary: 'Огляд публічного ClawHub: пошук, установлення, публікація, безпека та CLI clawhub.'
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T13:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр Skills і плагінів для OpenClaw.

- Використовуйте вбудовані команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та процесів видалення й відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий початок

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

Установіть CLI ClawHub, якщо вам потрібні автентифіковані в реєстрі операції, як-от
публікація, видалення або відновлення:

```bash
npm i -g clawhub
# або
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Компонент       | Що він зберігає                                              | Типова команда                               |
| --------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills          | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Плагіни коду    | Пакети плагінів OpenClaw із метаданими сумісності            | `openclaw plugins install clawhub:<package>` |
| Пакети плагінів | Запаковані набори плагінів для розповсюдження OpenClaw       | `clawhub package publish <source>`           |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення перевірок безпеки. Публічні сторінки показують поточний стан
реєстру, щоб користувачі могли перевірити Skill або плагін перед установленням.

## Вбудовані процеси OpenClaw

Вбудовані команди OpenClaw установлюють компоненти в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб наступні команди оновлення могли й надалі використовувати ClawHub.

Використовуйте `clawhub:<package>`, якщо встановлення плагіна має виконуватися через ClawHub.
Специфікатори плагінів без префікса, сумісні з npm, під час перехідного запуску можуть оброблятися через npm, а
`npm:<package>` завжди використовує лише npm, коли джерело потрібно вказати явно.

Під час установлення плагінів перевіряється заявлена сумісність `pluginApi` і `minGatewayVersion`
до початку встановлення архіву. Якщо для версії пакета опубліковано артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому файлу npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти та записує метадані артефакту для
подальших оновлень.

## CLI ClawHub

CLI ClawHub призначений для роботи, що потребує автентифікації в реєстрі:

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

CLI також має команди встановлення й оновлення Skills для безпосередньої роботи з реєстром:

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

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виведення, зручного для CI.

Плагіни коду мають містити обов’язкові метадані сумісності з OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` та
`openclaw.build.openclawVersion`. Повний довідник команд див. у розділі [CLI](/uk/clawhub/cli),
а відомості про метадані Skills — у розділі [Формат Skill](/clawhub/skill-format).

## Безпека та модерація

ClawHub за замовчуванням відкритий: завантажувати матеріали може будь-хто, але для публікації потрібен обліковий запис
GitHub, достатньо давній, щоб пройти обмеження на завантаження. Публічні сторінки відомостей підсумовують
стан останньої перевірки перед установленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і випусків плагінів. Випуски,
затримані перевіркою або заблоковані, можуть зникнути з публічного каталогу й інтерфейсів установлення,
залишаючись видимими для власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть повідомляти про Skills і пакети. Модератори можуть розглядати повідомлення,
приховувати або відновлювати вміст і блокувати облікові записи порушників. Докладніше про правила та їх застосування див. у розділах
[Безпека](/clawhub/security),
[Аудити безпеки](/uk/clawhub/security-audits),
[Модерація та безпека облікових записів](/clawhub/moderation) і
[Прийнятне використання](/clawhub/acceptable-usage).

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може за можливості
надіслати подію встановлення, щоб ClawHub міг обчислювати сукупну кількість установлень. Вимкнути це можна так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення змінних середовища:

| Змінна                        | Дія                                               |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL-адресу сайту для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL-адресу API реєстру.              |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена й конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлень.                   |

Докладніші довідкові матеріали див. у розділах [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/clawhub/troubleshooting).
