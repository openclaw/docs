---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або plugins у реєстрі
    - Вибір між CLI-потоками openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для пошуку, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T08:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для навичок і плагінів OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати навички, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте навички за допомогою OpenClaw:

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

Установіть CLI ClawHub, коли вам потрібні автентифіковані в реєстрі процеси, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                  | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Кодові плагіни | Пакети плагінів OpenClaw із метаданими сумісності            | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані пакети плагінів для дистрибуції OpenClaw          | `clawhub package publish <source>`           |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення сканування безпеки. Публічні сторінки показують
поточний стан реєстру, щоб користувачі могли переглянути навичку або плагін перед установленням.

## Нативні процеси OpenClaw

Нативні команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Прості npm-сумісні специфікації плагінів можуть оброблятися через npm під час перехідних запусків, а
`npm:<package>` залишається лише для npm, коли джерело має бути явним.

Установлення плагінів перевіряє оголошену сумісність `pluginApi` і `minGatewayVersion`
перед установленням архіву. Коли версія пакета публікує артефакт ClawPack, OpenClaw віддає
перевагу точно завантаженому npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і завантажені байти,
а також записує метадані артефакту для подальших оновлень.

## CLI ClawHub

CLI ClawHub призначений для автентифікованої в реєстрі роботи:

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

CLI також має команди встановлення/оновлення навичок для прямих процесів із реєстром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють навички в `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте навички з локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва навички в опублікованій URL-адресі.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або URL-адреси
GitHub:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат навички](/clawhub/skill-format) для метаданих навичок.

## Безпека та модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але для публікації потрібен обліковий запис GitHub,
достатньо давній, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед установленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих навичок і випусків плагінів. Випуски, утримані
скануванням або заблоковані, можуть зникнути з публічного каталогу та поверхонь установлення, але
залишатися видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про навички та пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікового запису](/clawhub/moderation) і
[Прийнятне використання](/clawhub/acceptable-usage) для подробиць політик і застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати подію встановлення
за принципом best-effort, щоб ClawHub міг обчислювати агреговану кількість установлень. Вимкніть це за допомогою:

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
