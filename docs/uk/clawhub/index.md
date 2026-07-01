---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи Plugin
    - Публікація Skills або plugins у реєстрі
    - Вибір між CLI-потоками openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T15:30:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для skills і плагінів OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, установлювати й оновлювати skills, а також установлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте та встановлюйте skills за допомогою OpenClaw:

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

Установіть ClawHub CLI, коли потрібні автентифіковані через реєстр робочі процеси, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що вона зберігає                                             | Типова команда                               |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версійовані текстові набори з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Кодові плагіни | Пакети плагінів OpenClaw з метаданими сумісності             | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані набори плагінів для дистрибуції OpenClaw          | `clawhub package publish <source>`           |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути skill або плагін перед установленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw установлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб пізніші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Прості npm-сумісні специфікації плагінів можуть вирішуватися через npm під час перехідних етапів запуску, а
`npm:<package>` залишається лише для npm, коли джерело має бути явним.

Установлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед запуском установлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти, а також записує метадані артефакту для
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
```

CLI також має команди встановлення/оновлення skills для прямих робочих процесів із реєстром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють skills у `./skills` у поточному робочому каталозі
та записують установлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте skills з локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва URL опублікованого skill.
- `--name <name>`: відображувана назва.
- `--version <version>`: semver-версія.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб побудувати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити потрібні метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат skill](/clawhub/skill-format) для метаданих skill.

## Безпека та модерація

ClawHub за замовчуванням відкритий: завантажувати може будь-хто, але для публікації потрібен GitHub
обліковий запис достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед установленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих skills і релізів плагінів. Релізи,
утримані скануванням або заблоковані, можуть зникати з публічного каталогу та поверхонь установлення,
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть скаржитися на skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/clawhub/security-audits),
[Модерація та безпека облікових записів](/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для подробиць політики та її застосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати best-effort
подію встановлення, щоб ClawHub міг обчислювати агреговані лічильники встановлень. Вимкніть це за допомогою:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                             |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, який використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                     |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає типовий робочий каталог.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                  |

Див. [Телеметрія](/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для глибших довідкових матеріалів.
