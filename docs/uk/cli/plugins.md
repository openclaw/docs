---
read_when:
    - Ви хочете встановити Plugin-и Gateway або сумісні пакети чи керувати ними
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-28T23:41:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a27d62f78692da7744af28cb5427f43004063e7b5721a945232c995bc405186d
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/uk/tools/plugin">
    Посібник для кінцевого користувача з установлення, увімкнення й усунення проблем із плагінами.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Security" href="/uk/gateway/security">
    Посилення безпеки для встановлень плагінів.
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

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру запускайте
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані плагіни постачаються разом з OpenClaw. Деякі ввімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); для інших потрібна команда `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Установлення

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Імена пакетів без префікса спочатку перевіряються в ClawHub, потім у npm. Ставтеся до встановлення плагінів як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість розгортання. Підтримувані форми див. у [Включеннях конфігурації](/uk/gateway/configuration).

    Якщо під час установлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спочатку потрібно виконати `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна, щоб інші канали й плагіни могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис плагіна в карантин. Єдиний задокументований виняток під час установлення — вузький шлях відновлення вбудованих плагінів для плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно використовує наявну ціль установлення й перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли справді потрібно перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm-специфікації.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — аварійний параметр для хибних спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політик хуків `before_install` плагіна й **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків установлення/оновлення плагінів. Установлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills з ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Установлення залежностей виконуються локально в проєкті з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли потрібно пропустити пошук у ClawHub і встановити безпосередньо з npm. Специфікації пакетів без префікса все одно віддають перевагу ClawHub і повертаються до npm лише тоді, коли в ClawHub немає цього пакета або версії.

    Специфікації без версії та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них у попередній реліз, OpenClaw зупиняється й просить явно погодитися за допомогою тегу попереднього релізу, наприклад `@beta`/`@rc`, або точної версії попереднього релізу, наприклад `@1.2.3-beta.4`.

    Якщо специфікація встановлення без префікса збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити дійсний `openclaw.plugin.json` у корені витягнутого плагіна; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з маркетплейсу Claude.

  </Accordion>
</AccordionGroup>

Установлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також віддає перевагу ClawHub для npm-безпечних специфікацій плагінів без префікса. Він повертається до npm лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність plugin API / мінімального Gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійовану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли потрібно передати джерело маркетплейсу явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь маркетплейсу або шлях до `marketplace.json`
    - скорочення репозиторію GitHub на кшталт `owner/repo`
    - URL репозиторію GitHub на кшталт `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає відносні джерела шляхів із цього репозиторію й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непосилальні на шлях джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex бандли (`.codex-plugin/plugin.json`)
- сумісні з Claude бандли (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor бандли (`.cursor-plugin/plugin.json`)

<Note>
Сумісні бандли встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Сьогодні підтримуються bundle skills, command-skills Claude, значення за замовчуванням Claude `settings.json`, значення за замовчуванням Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні директорії хуків Codex; інші виявлені можливості бандлів показуються в діагностиці/info, але ще не під’єднані до виконання в runtime.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише ввімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлено плагін, чи ввімкнено його та чи видимий він для планування холодного запуску, але це не live runtime probe уже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з bundled Plugin усередині упакованого Docker-образу змонтуйте каталог
джерел Plugin поверх відповідного упакованого шляху до джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання
джерел перед `/app/dist/extensions/synology-chat`; звичайний скопійований
каталог джерел залишиться неактивним, тож звичайні упаковані встановлення й далі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --json` показує зареєстровані hooks і діагностику з проходу інспекції із завантаженим модулем.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях до конфігурації та стан RPC.
- Небандловані hooks розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це стан, керований машиною, а не користувацька конфігурація. Встановлення й оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` — це холодний кеш реєстру, похідний від маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить у конфігурації поставлені застарілі записи `plugins.installs`, він переносить їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списку дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований у корені розширень Plugin OpenClaw. Для plugins активної пам’яті слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень пакетів hooks у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання id Plugin проти npm-специфікації">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії й надалі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії чи тегу також розв’язується назад до відстежуваного запису Plugin. Використовуйте це, коли Plugin було закріплено на точній версії, і ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє версію встановленого пакета за метаданими npm-реєстру. Якщо встановлена версія і записана ідентичність артефакта вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики Plugin `before_install` або блокування через помилки сканування, і застосовується лише до оновлень Plugin, а не до оновлень пакетів hooks.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, hooks, інструменти, команди, сервіси, методи Gateway, HTTP-маршрути, прапори політик, діагностику, метадані встановлення, можливості bundle і будь-яку виявлену підтримку MCP- або LSP-сервера.

Кожен Plugin класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапор `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відтворює таблицю для всього парку з колонками форми, типів можливостей, повідомлень про сумісність, можливостей bundle і зведення hooks. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для помилок форми модуля, як-от відсутніх експортів `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена холодна модель читання OpenClaw для ідентичності встановлених Plugin, їх увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналів та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфестів/пакетів. Це шлях відновлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для помилок читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env fallback призначений лише для аварійного відновлення запуску, поки міграція розгортається.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях `marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела разом із розібраним маніфестом маркетплейсу та записами Plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні plugins](/uk/plugins/community)
