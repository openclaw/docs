---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи plugins
    - Публікація Skills або плагінів у реєстрі
    - Вибір між сценаріями CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T08:21:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для OpenClaw Skills і плагінів.

- Використовуйте нативні команди `openclaw`, щоб шукати, установлювати й оновлювати Skills, а також установлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

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

Установіть ClawHub CLI, коли потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що вона зберігає                                             | Типова команда                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Кодові плагіни | Пакети плагінів OpenClaw з метаданими сумісності             | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані пакети плагінів для дистрибуції OpenClaw          | `clawhub package publish <source>`           |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та зведення перевірок безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути Skill або плагін перед установленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw установлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Під час запускових переходів прості npm-безпечні специфікації плагінів можуть вирішуватися через npm, а
`npm:<package>` залишається лише npm, коли джерело має бути явним.

Установлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед запуском установлення архіву. Коли версія пакета публікує артефакт
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

Публікуйте Skills з локальної теки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва URL опублікованого Skill.
- `--name <name>`: відображувана назва.
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
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника
команд і [Формат Skill](/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub за замовчуванням відкритий: завантажувати може будь-хто, але публікація потребує GitHub
акаунта, достатньо давнього для проходження шлюзу завантаження. Публічні сторінки деталей підсумовують
останній стан перевірки перед установленням або завантаженням.

ClawHub запускає автоматизовані перевірки опублікованих Skills і релізів плагінів. Релізи, утримані перевіркою
або заблоковані, можуть зникати з публічного каталогу та поверхонь установлення, але
залишатися видимими для їхнього власника в `/dashboard`.

Користувачі, які ввійшли в систему, можуть скаржитися на Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні акаунти. Див.
[Безпека](/clawhub/security),
[Аудити безпеки](/uk/clawhub/security-audits),
[Модерація та безпека акаунта](/clawhub/moderation) і
[Прийнятне використання](/clawhub/acceptable-usage) для деталей політики та застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати
подію встановлення за принципом найкращого зусилля, щоб ClawHub міг обчислювати агреговані лічильники встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                       | Ефект                                            |
| ---------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`               | Перевизначає URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`           | Перевизначає URL API реєстру.                    |
| `CLAWHUB_CONFIG_PATH`        | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`            | Перевизначає робочий каталог за замовчуванням.   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлення.                 |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/clawhub/http-api) і
[Усунення несправностей](/clawhub/troubleshooting) для докладніших довідкових матеріалів.
