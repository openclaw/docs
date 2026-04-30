---
read_when:
    - Ви хочете встановити Plugin-и Gateway чи сумісні пакети або керувати ними
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідка CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T03:18:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами hooks і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів із встановлення, увімкнення й усунення неполадок plugins.
  </Card>
  <Card title="Bundles Plugin" href="/uk/plugins/bundles">
    Модель сумісності bundle.
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

Для розслідування повільного встановлення, перевірки, видалення або оновлення registry запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані providers моделей, вбудовані providers мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) та виявлені можливості bundle.
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
Голі назви packages перевіряються спочатку в ClawHub, потім у npm. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості plugins. Npm
залишається підтримуваним запасним і прямим шляхом встановлення. Під час міграції до
ClawHub OpenClaw досі постачає деякі належні OpenClaw packages plugins `@openclaw/*`
в npm; версії цих packages можуть відставати від вбудованого вихідного коду між
циклами випуску plugins. Якщо npm повідомляє, що належний OpenClaw package plugin
є застарілим, ця опублікована версія є старим зовнішнім артефактом; використовуйте plugin,
вбудований у поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший package npm.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` базується на однофайловому `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються закрито замість flattening. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє спершу запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші channels і plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний документований виняток під час встановлення — вузький шлях відновлення для вбудованих plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти update">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або hook pack на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, package ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли справді потрібно перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, бо marketplace-встановлення зберігають метадані джерела marketplace замість spec npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики hook `before_install` plugin і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill із ClawHub.

    Якщо plugin, який ви опублікували в ClawHub, заблоковано registry scan, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs і npm specs">
    `plugins install` також є поверхнею встановлення для hook packs, які оголошують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості hooks і ввімкнення окремих hooks, а не для встановлення package.

    Specs npm є **лише registry** (назва package + необов’язкова **точна версія** або **dist-tag**). Specs Git/URL/file і semver ranges відхиляються. Встановлення залежностей запускаються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Голі specs package все одно надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого package або версії.

    Голі specs і `@latest` залишаються на stable track. Якщо npm resolves будь-який із них до prerelease, OpenClaw зупиняється й просить явно ввімкнути це за допомогою prerelease tag, як-от `@beta`/`@rc`, або точної prerelease version, як-от `@1.2.3-beta.4`.

    Якщо голий install spec збігається з id вбудованого plugin (наприклад `diffs`), OpenClaw встановлює вбудований plugin безпосередньо. Щоб установити package npm з такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у корені розпакованого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише install records.

    Встановлення Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-safe specs plugin. Він повертається до npm лише тоді, коли ClawHub не має такого package або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати лише npm resolution, наприклад коли ClawHub недоступний або ви знаєте, що package існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів package з ClawHub, перевіряє оголошену сумісність plugin API / minimum gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні selectors версії або tag, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим selector.

#### Скорочений запис marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному cache registry Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - скорочення repo GitHub, як-от `owner/repo`
    - URL repo GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених із GitHub або git, записи plugin мають залишатися всередині клонованого repo marketplace. OpenClaw приймає джерела з відносними шляхами з цього repo й відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-path джерела plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні OpenClaw plugins (`openclaw.plugin.json`)
- Codex-сумісні bundles (`.codex-plugin/plugin.json`)
- Claude-сумісні bundles (`.claude-plugin/plugin.json` або стандартний layout components Claude)
- Cursor-сумісні bundles (`.cursor-plugin/plugin.json`)

<Note>
Сумісні bundles встановлюються у звичайний корінь plugin і беруть участь у тому самому потоці list/info/enable/disable. Нині підтримуються bundle skills, command-skills Claude, defaults Claude `settings.json`, defaults Claude `.lsp.json` / оголошені в manifest `lspServers`, command-skills Cursor і сумісні directories hooks Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не під’єднані до виконання runtime.
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
  Перемкнутися з табличного подання на рядки деталізації для кожного plugin із метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний inventory плюс diagnostics registry.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр Plugin, із запасним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлено, увімкнено та видно для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованим Plugin усередині запакованого образу Docker примонтуйте каталог
джерел Plugin поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерел
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел
залишається неактивним, тому звичайні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та стан RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, бо пов’язані встановлення повторно використовують шлях джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку без фіксації версії.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є станом, керованим машиною, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` під активним каталогом стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` є холодним кешем реєстру, виведеним із маніфестів. Файл містить попередження не редагувати його й використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Runtime-залежності

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` інспектує запакований етап runtime-залежностей для вбудованих Plugin, що належать OpenClaw і вибрані конфігурацією Plugin, увімкненими/налаштованими каналами, налаштованими провайдерами моделей або типовими значеннями вбудованих маніфестів. Це не шлях встановлення/оновлення для сторонніх npm або ClawHub Plugin.

Використовуйте `--repair`, коли запаковане встановлення повідомляє про відсутні runtime-залежності вбудованих Plugin під час запуску Gateway або `plugins doctor`. Виправлення встановлює лише відсутні залежності увімкнених вбудованих Plugin із вимкненими lifecycle-скриптами. Використовуйте `--prune`, щоб видалити застарілі невідомі корені зовнішніх runtime-залежностей, залишені старішими запакованими макетами.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списків allow/deny для Plugin, а також пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Active Memory Plugin слот пам’яті скидається до `memory-core`.

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
    Коли ви передаєте ідентифікатор Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні зафіксовані версії й далі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень на основі ідентифікатора.

    Передавання назви npm-пакета без версії або тега також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin був зафіксований на точній версії, а ви хочете повернути його до типової лінії релізів реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія й записана ідентичність артефакта вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики `before_install` Plugin або блокування через помилку сканування, і застосовується лише до оновлень Plugin, а не до оновлень пакетів хуків.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи Gateway, HTTP-маршрути, прапори політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен Plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапор `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку зі стовпцями форми, типів можливостей, сповіщень сумісності, можливостей пакета та зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та сповіщення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin є збереженою холодною read model OpenClaw для ідентичності встановлених Plugin, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях виправлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` є застарілим аварійним перемикачем сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env-запасний варіант призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях Marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела, а також розібраний маніфест Marketplace і записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
