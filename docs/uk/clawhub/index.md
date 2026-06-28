---
read_when:
    - Пояснення, що таке ClawHub
    - Пошук, встановлення або оновлення Skills чи плагінів
    - Публікація Skills або plugins у реєстрі
    - Вибір між процесами CLI openclaw і clawhub
sidebarTitle: ClawHub
summary: Огляд публічного ClawHub для пошуку, встановлення, публікації, безпеки та CLI clawhub.
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T05:07:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub — це публічний реєстр Skills і plugins для OpenClaw.

- Використовуйте вбудовані команди `openclaw`, щоб шукати, встановлювати й оновлювати skills, а також встановлювати plugins із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації та робочих процесів видалення/відновлення.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

Шукайте й встановлюйте skills за допомогою OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Шукайте й встановлюйте plugins за допомогою OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Встановіть CLI ClawHub, коли потрібні робочі процеси з автентифікацією в реєстрі, як-от
публікація або видалення/відновлення:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Що розміщує ClawHub

| Поверхня       | Що зберігає                                                        | Типова команда                              |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Skills         | Версіоновані текстові пакети з `SKILL.md` і допоміжними файлами    | `openclaw skills install @openclaw/demo`   |
| Code plugins   | Пакунки plugins OpenClaw з метаданими сумісності                   | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | Запаковані набори plugins для дистрибуції OpenClaw                 | `clawhub package publish <source>`         |

ClawHub відстежує semver-версії, теги на кшталт `latest`, журнали змін, файли,
завантаження, зірки та підсумки сканування безпеки. Публічні сторінки показують поточний стан реєстру,
щоб користувачі могли переглянути skill або plugin перед встановленням.

## Вбудовані потоки OpenClaw

Вбудовані команди OpenClaw встановлюють в активний робочий простір OpenClaw і зберігають
метадані джерела, щоб подальші команди оновлення могли залишатися на ClawHub.

Використовуйте `clawhub:<package>`, коли встановлення plugin має виконуватися через ClawHub.
Прості npm-сумісні специфікації plugins можуть виконуватися через npm під час перехідних запусків, а
`npm:<package>` залишається лише npm-джерелом, коли джерело має бути явним.

Встановлення plugins перевіряє заявлену сумісність `pluginApi` і `minGatewayVersion`
перед встановленням архіву. Коли версія пакунка публікує артефакт
ClawPack, OpenClaw надає перевагу точно завантаженому npm-pack `.tgz`, перевіряє
заголовок дайджесту ClawHub і завантажені байти, а також записує метадані артефакту для
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

CLI також має команди встановлення/оновлення skills для прямих робочих процесів із реєстром:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Ці команди встановлюють skills у `./skills` у поточному робочому каталозі
та записують встановлені версії в `.clawhub/lock.json`.

## Публікація

Публікуйте skills із локальної папки, що містить `SKILL.md`:

```bash
clawhub skill publish <path>
```

Поширені опції публікації:

- `--slug <slug>`: назва URL опублікованого skill.
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
для виводу, зручного для CI.

Code plugins мають містити обов’язкові метадані сумісності OpenClaw у
`package.json`, зокрема `openclaw.compat.pluginApi` і
`openclaw.build.openclawVersion`. Див. [CLI](/uk/clawhub/cli) для повного довідника команд
і [Формат skill](/uk/clawhub/skill-format) для метаданих skill.

## Безпека та модерація

ClawHub відкритий за замовчуванням: завантажувати може будь-хто, але для публікації потрібен обліковий запис GitHub,
достатньо старий, щоб пройти шлюз завантаження. Публічні сторінки деталей підсумовують
останній стан сканування перед встановленням або завантаженням.

ClawHub виконує автоматизовані перевірки опублікованих skills і релізів plugins. Релізи, утримані скануванням
або заблоковані, можуть зникати з публічного каталогу й поверхонь встановлення, але
залишатися видимими для свого власника в `/dashboard`.

Користувачі, що ввійшли в систему, можуть повідомляти про skills і packages. Модератори можуть переглядати скарги,
приховувати або відновлювати вміст і блокувати зловживальні облікові записи. Див.
[Безпека](/uk/clawhub/security),
[Аудити безпеки](/uk/clawhub/security-audits),
[Модерація та безпека облікового запису](/uk/clawhub/moderation) і
[Прийнятне використання](/uk/clawhub/acceptable-usage) для деталей політики та застосування правил.

## Телеметрія та середовище

Коли ви запускаєте `clawhub install`, увійшовши в систему, CLI може надіслати подію встановлення за принципом best-effort,
щоб ClawHub міг обчислювати агреговану кількість встановлень. Вимкніть це так:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Корисні перевизначення середовища:

| Змінна                        | Ефект                                                   |
| ----------------------------- | ------------------------------------------------------- |
| `CLAWHUB_SITE`                | Перевизначає URL сайту, що використовується для входу через браузер. |
| `CLAWHUB_REGISTRY`            | Перевизначає URL API реєстру.                           |
| `CLAWHUB_CONFIG_PATH`         | Перевизначає місце, де CLI зберігає стан токена/конфігурації. |
| `CLAWHUB_WORKDIR`             | Перевизначає стандартний робочий каталог.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію встановлень.                         |

Див. [Телеметрія](/uk/clawhub/telemetry), [HTTP API](/uk/clawhub/http-api) і
[Усунення несправностей](/uk/clawhub/troubleshooting) для докладніших довідкових матеріалів.
