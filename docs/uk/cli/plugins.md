---
read_when:
    - Ви хочете встановити плагіни Gateway або сумісні пакети чи керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-29T22:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c1ba79bccbbb74e3403188afc2dffc06e4215d433e2b23ed998b1fb09419601b
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте plugins Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Для дослідження повільного встановлення, інспектування, видалення або оновлення реєстру запускайте
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw повинні постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Встановлення

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
Голі назви пакетів спочатку перевіряються в ClawHub, потім у npm. Ставтеся до встановлення plugins як до запуску коду. Віддавайте перевагу зафіксованим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Під час міграції до
ClawHub OpenClaw все ще постачає деякі пакети plugins, що належать OpenClaw, `@openclaw/*`
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між релізними
потягами plugins. Якщо npm повідомляє, що пакет Plugin, який належить OpenClaw, застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями аварійно завершуються закрито замість сплощення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай аварійно завершується закрито й повідомляє спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin, щоб інші канали та plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для plugins, які явно підключаються до `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно повторно встановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного Plugin npm віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацьовувань вбудованого сканера небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хуків `before_install` Plugin і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills з ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експортують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально в проєкті з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити напряму з npm. Голі специфікації пакетів усе ще віддають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має цього пакета або версії.

    Голі специфікації та `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-яку з них у попередній реліз, OpenClaw зупиняється й просить явно підключитися за допомогою тегу попереднього релізу, такого як `@beta`/`@rc`, або точної версії попереднього релізу, такої як `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з id вбудованого Plugin (наприклад, `diffs`), OpenClaw встановлює вбудований Plugin напряму. Щоб встановити пакет npm з тією самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugins OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені витягнутого Plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також віддає перевагу ClawHub для голих npm-безпечних специфікацій Plugin. Він повертається до npm лише якщо ClawHub не має цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусити розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність API Plugin / мінімальну сумісність Gateway, а потім встановлює його через звичайний архівний шлях. Записані встановлення зберігають метадані джерела ClawHub для пізніших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійовану записану специфікацію, щоб `openclaw plugins update` міг стежити за новішими релізами ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете явно передати джерело marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, таке як `owner/repo`
    - URL репозиторію GitHub, такий як `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених з GitHub або git, записи Plugin повинні залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутівні джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- Codex-сумісні бандли (`.codex-plugin/plugin.json`)
- Claude-сумісні бандли (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- Cursor-сумісні бандли (`.cursor-plugin/plugin.json`)

<Note>
Сумісні бандли встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills бандлів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені маніфестом `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості бандлів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin із метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар і діагностика реєстру.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із похідним резервним варіантом лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно, щоб перевірити, чи Plugin встановлено, увімкнено та видно для планування холодного запуску, але це не live-зонд runtime для процесу Gateway, який уже працює. Після зміни коду Plugin, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань переконайтеся, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованим Plugin усередині запакованого Docker-образу примонтуйте каталог
джерельного коду Plugin поверх відповідного запакованого шляху джерельного коду, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це примонтоване накладання джерельного коду
раніше за `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерельного коду
залишається інертним, тож стандартні запаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та стан RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерельного коду замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку без фіксації.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є станом, керованим машиною, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його карта верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` є похідним від маніфесту кешем холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром Plugin.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який із записів завершується невдало, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Runtime-залежності

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` інспектує запакований етап runtime-залежностей для вбудованих Plugin, що належать OpenClaw. Це не шлях встановлення/оновлення для сторонніх npm або ClawHub Plugin.

Використовуйте `--repair`, коли запаковане встановлення повідомляє про відсутні вбудовані runtime-залежності під час запуску Gateway або `plugins doctor`. Відновлення встановлює лише відсутні залежності увімкнених вбудованих Plugin із вимкненими lifecycle-скриптами. Використовуйте `--prune`, щоб видалити застарілі невідомі зовнішні корені runtime-залежностей, залишені старішими запакованими макетами.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів allow/deny-списків Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо не задано `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Plugin активної пам’яті слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень пакетів хуків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання ідентифікатора Plugin проти npm-специфікації">
    Коли ви передаєте ідентифікатор Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні зафіксовані версії продовжують використовуватися в наступних запусках `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень на основі ідентифікатора.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису Plugin. Використовуйте це, коли Plugin було зафіксовано на точній версії, а ви хочете повернути його до типової лінії релізів реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live npm-оновленням OpenClaw перевіряє встановлену версію пакета щодо метаданих npm-реєстру. Якщо встановлена версія і записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики `before_install` Plugin або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, служби, методи Gateway, HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP або LSP-сервера.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, Plugin лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [Формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` рендерить таблицю для всього парку зі стовпцями форми, типів можливостей, повідомлень сумісності, можливостей пакета та зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена холодна read model OpenClaw для ідентичності встановлених Plugin, увімкнення, метаданих джерела та володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи наявний, актуальний або застарілий збережений реєстр. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-варіант призначений лише для екстреного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях Marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела разом із розібраним маніфестом Marketplace і записами Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
