---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, установлення або оновлення Skills чи plugins
    - Публікація Skills або плагінів у реєстрі
    - Вибір між потоками CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Публічний огляд ClawHub для виявлення, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-27T17:16:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр для Skills і плагінів OpenClaw.

- Використовуйте нативні команди `openclaw`, щоб шукати, встановлювати й оновлювати Skills, а також встановлювати плагіни з ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

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

Встановіть CLI ClawHub, коли вам потрібні автентифіковані в реєстрі робочі процеси, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                   | Типова команда                              |
| -------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Skills         | Версійовані текстові пакети з `SKILL.md` і допоміжними файлами | `openclaw skills install @openclaw/demo`     |
| Кодові плагіни | Пакети плагінів OpenClaw із метаданими сумісності             | `openclaw plugins install clawhub:<package>` |
| Пакетні плагіни | Запаковані пакети плагінів для дистрибуції OpenClaw           | `clawhub package publish <source>`           |

ClawHub відстежує версії semver, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан
реєстру, щоб користувачі могли перевірити Skill або плагін перед встановленням.

## Нативні потоки OpenClaw

Нативні команди OpenClaw встановлюють у активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення плагіна має виконуватися через ClawHub.
Необгорнуті npm-сумісні специфікації плагінів можуть розв’язуватися через npm під час перехідних запусків, а
`npm:<package>` лишається лише npm, коли джерело має бути явним.

Встановлення плагінів перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву. Коли версія пакета публікує артефакт
ClawPack, OpenClaw надає перевагу точному завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти, а також записує метадані артефакта для
подальших оновлень.

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

CLI також має команди встановлення/оновлення Skills для прямих робочих процесів реєстру:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють Skills у `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте Skills з локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені параметри публікації:

- `--slug <slug>`: назва опублікованого Skill в URL.
- `--name <name>`: відображувана назва.
- `--version <version>`: версія semver.
- `--changelog <text>`: текст журналу змін.
- `--tags <tags>`: теги, розділені комами, за замовчуванням `latest`.

Публікуйте плагіни з локальної папки, `owner/repo`, `owner/repo@ref` або GitHub
URL:

```bash
clawhub package publish <source>
```

Використовуйте `--dry-run`, щоб зібрати точний план публікації без завантаження, і `--json`
для виводу, зручного для CI.

Кодові плагіни мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повної довідки
команд і [Формат Skill](/uk/clawhub/skill-format) для метаданих Skill.

## Безпека та модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але публікація потребує GitHub
акаунта достатнього віку, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих Skills і релізів плагінів. Релізи, утримані скануванням
або заблоковані, можуть зникати з публічного каталогу та поверхонь встановлення, водночас
залишаючись видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про Skills і пакети. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати акаунти зловмисників. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/uk/clawhub/security-audits),
[Модерація та безпека акаунта](/uk/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для деталей політики та примусового застосування.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install` після входу в систему, CLI може надіслати best-effort
подію встановлення, щоб ClawHub міг обчислювати агреговану кількість встановлень. Вимкніть це за допомогою:

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

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
