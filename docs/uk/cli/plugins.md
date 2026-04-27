---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-27T09:29:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9358445a53d6ddf8db7823a6cb5fb6f0f2eca3bc48dd7747c3ad2a8fb4836bfe
    source_path: cli/plugins.md
    workflow: 15
---

Керуйте плагінами Gateway, пакетами хуків і сумісними пакетами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей плагінів.
  </Card>
  <Card title="Пакети Plugin" href="/uk/plugins/bundles">
    Модель сумісності пакетів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення плагінів.
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
Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Натомість сумісні пакети використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) разом із виявленими можливостями пакета.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install npm:<package>                  # лише npm
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # зафіксувати версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Звичайні назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення плагінів як до запуску коду. Віддавайте перевагу зафіксованим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після невалідної конфігурації">
    Якщо ваш розділ `plugins` використовує однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями безпечно завершуються помилкою замість сплющення. Підтримувані форми див. у [Включення конфігурації](/uk/gateway/configuration).

    Якщо конфігурація невалідна, `plugins install` зазвичай безпечно завершується помилкою і пропонує спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно погодилися на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна краще використовувати `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється і пропонує використовувати `plugins update <id-or-npm-spec>` для звичайного оновлення або `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень із npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не специфікацію npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про результати рівня `critical`, але **не** обходить блокування політик хука `before_install` плагіна і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Установлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills через ClawHub.

  </Accordion>
  <Accordion title="Пакети хуків і npm-специфікації">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які оголошують `openclaw.hooks` у `package.json`. Для фільтрованої видимості хуків і вмикання окремих хуків використовуйте `openclaw hooks`, а не встановлення пакета.

    Npm-специфікації є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації git/URL/file та діапазони semver відхиляються. З міркувань безпеки встановлення залежностей запускаються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, якщо хочете пропустити пошук у ClawHub і встановити пакет безпосередньо з npm. Звичайні специфікації пакетів усе ще віддають перевагу ClawHub і переходять до npm лише тоді, коли в ClawHub немає цього пакета або версії.

    Звичайні специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-який із цих варіантів до передрелізної версії, OpenClaw зупиняється і просить вас явно погодитися на це за допомогою передрелізного тегу, такого як `@beta`/`@rc`, або точної передрелізної версії, такої як `@1.2.3-beta.4`.

    Якщо звичайна специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб встановити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити валідний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з marketplace Claude.

  </Accordion>
</AccordionGroup>

Для встановлень із ClawHub використовується явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для звичайних plugin-специфікацій, безпечних для npm. Перехід до npm виконується лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово використовувати лише npm, наприклад, коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність із gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.
Неверсіоновані встановлення з ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версій або тегів, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочення для marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - корінь локального marketplace або шлях до `marketplace.json`
    - скорочений запис GitHub-репозиторію, наприклад `owner/repo`
    - URL GitHub-репозиторію, наприклад `https://github.com/owner/repo`
    - git URL
  </Tab>
  <Tab title="Правила для віддалених marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися в межах клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, які не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні пакети Codex (`.codex-plugin/plugin.json`)
- сумісні пакети Claude (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- сумісні пакети Cursor (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються в звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання в runtime.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише увімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Придатний для машинного читання список плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, а якщо реєстр відсутній або невалідний — використовує резервний варіант, побудований лише з маніфесту. Це корисно для перевірки, чи плагін установлено, увімкнено і чи він видимий для планування холодного запуску, але це не жива runtime-перевірка вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте саме дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Під час роботи з вбудованими плагінами всередині упакованого Docker-образу змонтуйте вихідний каталог плагіна через bind-mount поверх відповідного упакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване перекриття вихідного коду раніше, ніж `/app/dist/extensions/synology-chat`; звичайно скопійований вихідний каталог залишається неактивним, тому стандартні упаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях до конфігурації та стан RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для встановлень із npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення та оновлення записують їх у `plugins/installs.json` у межах активного каталогу стану OpenClaw. Його карта верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, побудований на основі маніфестів. Файл містить попередження про заборону редагування та використовується командами `openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації успадковані записи `plugins.installs`, що постачалися раніше, він переносить їх до індексу плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи в конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів у списках дозволу/заборони плагінів, а також пов’язаних записів `plugins.load.paths`, якщо це застосовно. Якщо не задано `--keep-files`, uninstall також видаляє відстежуваний каталог керованого встановлення, якщо він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і до відстежуваних встановлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення id плагіна проти npm-специфікації">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точно зафіксовані версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для встановлень із npm ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тега також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін був зафіксований на точній версії, і ви хочете повернути його на стандартну лінію випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим оновленням із npm OpenClaw перевіряє версію встановленого пакета щодо метаданих реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення безпечно завершуються помилкою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час оновлення плагінів. Він, як і раніше, не обходить блокування політик `before_install` плагіна чи блокування через помилки сканування, і застосовується лише до оновлень плагінів, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Поглиблена інспекція для одного плагіна. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway, HTTP-маршрути, прапорці політик, diagnostics, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен плагін класифікується за тим, що саме він фактично реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей чи поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить придатний для машинного читання звіт, який підходить для сценаріїв і аудиту. `inspect --all` виводить загальносистемну таблицю з колонками форми, типів можливостей, повідомлень про сумісність, можливостей пакета та зведення хуків. `info` — це псевдонім для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics маніфесту/виявлення та повідомлення про сумісність. Якщо все в порядку, виводиться `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту у вивід diagnostics.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація плагінів можуть читати його без імпортування runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр існує, чи є він актуальним або застарілим. Використовуйте `--refresh`, щоб перебудувати його із збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації в runtime.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL GitHub-репозиторію або git URL. `--json` виводить мітку розв’язаного джерела разом із проаналізованим маніфестом marketplace та записами плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні плагіни](/uk/plugins/community)
