---
read_when:
    - Ви хочете встановити або керувати Gateway plugins чи сумісними пакетами
    - Ви хочете налагодити збої завантаження plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T09:06:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee842072b725abbeb229282e1bd16478216f52145f0aa27355c4cbd7c7794966
    source_path: cli/plugins.md
    workflow: 15
---

Керуйте Gateway plugins, пакетами hook та сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення проблем із plugins.
  </Card>
  <Card title="Пакети Plugin" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення plugins.
  </Card>
</CardGroup>

## Команди

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
Вбудовані plugins постачаються разом з OpenClaw. Деякі увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) та виявлені можливості пакета.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # зафіксувати версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Імена пакетів без уточнень спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення plugins так, ніби ви запускаєте код. Віддавайте перевагу зафіксованим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після невалідної конфігурації">
    Якщо ваш розділ `plugins` використовує однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й не змінюють `openclaw.json`. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються без змін замість сплощення. Підтримувані форми описано в [Включення конфігурації](/uk/gateway/configuration).

    Якщо конфігурація невалідна, `plugins install` зазвичай завершується без змін і пропонує спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих plugins, які явно ввімкнули `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або пакет hook на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви дійсно хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки рівня `critical`, але **не** обходить блокування політики hook `before_install` plugin і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugins. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

  </Accordion>
  <Accordion title="Пакети hook та специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів hook, які надають `openclaw.hooks` у `package.json`. Для відфільтрованої видимості hook і вмикання окремих hook використовуйте `openclaw hooks`, а не встановлення пакетів.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file та діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні налаштування npm install.

    Базові специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них до prerelease, OpenClaw зупиняється й просить вас явно погодитися на це за допомогою мітки prerelease, такої як `@beta`/`@rc`, або точної версії prerelease, такої як `@1.2.3-beta.4`.

    Якщо базова специфікація встановлення збігається з id вбудованого plugin (наприклад, `diffs`), OpenClaw встановлює вбудований plugin безпосередньо. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugins OpenClaw мають містити валідний `openclaw.plugin.json` у корені розпакованого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з marketplace Claude.

  </Accordion>
</AccordionGroup>

Для встановлення з ClawHub використовується явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для базових безпечних для npm специфікацій plugins. До npm він звертається лише якщо в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API plugin / мінімальну сумісність Gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

#### Скорочений запис Marketplace

Використовуйте скорочений запис `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, якщо хочете явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - відома Claude назва marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях до `marketplace.json`
    - скорочений запис GitHub-репозиторію, наприклад `owner/repo`
    - URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
    - git URL
  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи plugins мають залишатися в межах клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), absolute-path, git, GitHub та інші джерела plugins, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги hook Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показати лише увімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного plugin із метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний інвентар разом із діагностикою реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр plugins із похідним резервним варіантом лише з маніфесту, якщо реєстр відсутній або невалідний. Це корисно, щоб перевірити, чи plugin встановлено, увімкнено й чи він видимий для планування холодного запуску, але це не жива перевірка рантайму для вже запущеного процесу Gateway. Після зміни коду plugin, стану увімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуск нового коду `register(api)` або hook. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте саме дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для налагодження hook під час роботи:

- `openclaw plugins inspect <id> --json` показує зареєстровані hook і діагностику з проходу перевірки після завантаження модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Не вбудовані hook розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) вимагають `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують вихідний шлях замість копіювання у керовану ціль встановлення.

Використовуйте `--pin` для встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі plugins, зберігаючи типову поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення та оновлення записують їх у `plugins/installs.json` у активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів plugin. Масив `plugins` є кешем холодного реєстру, похідним від маніфесту. Файл містить попередження не редагувати його вручну й використовується командами `openclaw plugins update`, uninstall, diagnostics і холодним реєстром plugins.

Коли OpenClaw виявляє успадковані записи `plugins.installs`, що постачаються в конфігурації, він переносить їх до індексу plugins і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, збереженого індексу plugins, allowlist plugins і пов’язаних записів `plugins.load.paths`, якщо це застосовно. Якщо не вказано `--keep-files`, uninstall також видаляє відстежуваний керований каталог встановлення, якщо він розташований у корені розширень plugins OpenClaw. Для plugins Active Memory слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень plugin у керованому індексі plugins і до відстежуваних встановлень пакетів hook у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення id plugin порівняно зі специфікацією npm">
    Коли ви передаєте id plugin, OpenClaw повторно використовує збережену специфікацію встановлення для цього plugin. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно зафіксовані версії й надалі використовуються в наступних запусках `update <id>`.

    Для встановлень npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із записом відстежуваного plugin, оновлює цей встановлений plugin і зберігає нову специфікацію npm для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тега також зіставляється назад із записом відстежуваного plugin. Використовуйте це, якщо plugin було зафіксовано на точній версії й ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед виконанням реального оновлення npm OpenClaw перевіряє версію встановленого пакета за метаданими реєстру npm. Якщо встановлена версія та ідентичність збереженого артефакту вже відповідають цільовому результату, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

    Якщо збережено хеш цілісності й хеш завантаженого артефакту змінюється, OpenClaw розцінює це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються без змін, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний для `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень plugin. Він, як і раніше, не обходить блокування політики `before_install` plugin або блокування через помилки сканування, і застосовується лише до оновлень plugin, а не до оновлень пакетів hook.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Поглиблена перевірка одного plugin. Показує ідентичність, статус завантаження, джерело, зареєстровані можливості, hook, tools, commands, services, методи gateway, HTTP-маршрути, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP server.

Кожен plugin класифікується за тим, що саме він реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, plugin лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, text + speech + images)
- **hook-only** — лише hook, без можливостей або поверхонь
- **non-capability** — tools/commands/services без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитаний звіт, придатний для скриптів і аудиту. `inspect --all` відображає загальносистемну таблицю з колонками форми, типів можливостей, повідомлень про сумісність, можливостей пакетів і зведенням hook. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Якщо все в порядку, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутність експортів `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту до діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugins — це збережена модель холодного читання OpenClaw для ідентичності встановлених plugins, стану увімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація plugins можуть читати його без імпорту модулів runtime plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний чи застарілий. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу plugins, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-варіант призначено лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку визначеного джерела разом із розібраним маніфестом marketplace і записами plugins.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні plugins](/uk/plugins/community)
