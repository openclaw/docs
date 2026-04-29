---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-29T05:38:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68d6a2734c7b4a3608467c64426f48bdf8dc1a36e33b51ba024313fc36762b5b
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте plugins Gateway, наборами хуків і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей plugins.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Для дослідження повільного встановлення, інспектування, видалення або оновлення registry запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw повинні постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundle.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип bundle (`codex`, `claude` або `cursor`) і виявлені можливості bundle.
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
Голі назви пакетів спочатку перевіряються в ClawHub, потім у npm. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі належні OpenClaw пакети Plugin `@openclaw/*`
у npm; версії цих пакетів можуть відставати від вбудованого джерела між хвилями релізів
Plugin. Якщо npm повідомляє, що належний OpenClaw пакет Plugin застарілий, ця
опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються безпечно, замість того щоб сплющуватися. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується безпечно й повідомляє спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin, щоб інші канали й plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих plugins, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти update">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або набір хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється та спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але він **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків install/update для Plugin. Встановлення залежностей Skills за підтримки Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували на ClawHub, заблоковано скануванням registry, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Набори хуків і npm specs">
    `plugins install` також є поверхнею встановлення для наборів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише registry** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver ranges відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити напряму з npm. Голі package specs усе ще надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має цього пакета або версії.

    Голі specs і `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися за допомогою prerelease tag, наприклад `@beta`/`@rc`, або точної prerelease version, наприклад `@1.2.3-beta.4`.

    Якщо голий install spec збігається з id вбудованого Plugin (наприклад, `diffs`), OpenClaw встановлює вбудований Plugin напряму. Щоб установити пакет npm з такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugins OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-safe plugin specs. Він повертається до npm лише тоді, коли ClawHub не має цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати розв’язання лише через npm, наприклад, коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлений API Plugin / мінімальну сумісність gateway, а потім встановлює його через звичайний архівний шлях. Записані встановлення зберігають свої метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або tag, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші registry Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - назва відомого Claude marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення GitHub repo, наприклад `owner/repo`
    - URL GitHub repo, наприклад `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого repo marketplace. OpenClaw приймає джерела з відносними шляхами з цього repo та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex bundles (`.codex-plugin/plugin.json`)
- сумісні з Claude bundles (`.claude-plugin/plugin.json` або типовий layout компонентів Claude)
- сумісні з Cursor bundles (`.cursor-plugin/plugin.json`)

<Note>
Сумісні bundles встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, Claude command-skills, defaults Claude `settings.json`, defaults Claude `.lsp.json` / оголошені в маніфесті defaults `lspServers`, Cursor command-skills і сумісні директорії хуків Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не підключені до runtime execution.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показувати лише ввімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного вигляду на докладні рядки для кожного Plugin з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитаний inventory плюс diagnostics registry.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із резервним варіантом, похідним лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно, щоб перевірити, чи встановлено Plugin, чи ввімкнено його та чи видимий він для планування холодного запуску, але це не живе runtime-зондування вже запущеного процесу Gateway. Після зміни коду Plugin, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, що обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованим Plugin усередині запакованого Docker-образу змонтуйте з прив’язкою вихідний каталог Plugin
поверх відповідного запакованого шляху до вихідного коду, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований вихідний
оверлей перед `/app/dist/extensions/synology-chat`; звичайний скопійований
каталог із вихідним кодом лишається неактивним, тож звичайні запаковані встановлення й надалі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях до вихідного коду замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є станом, керованим машиною, а не користувацькою конфігурацією. Встановлення та оновлення записують їх у `plugins/installs.json` в активному каталозі стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` є похідним із маніфесту кешем холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром Plugin.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх до індексу Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin із `plugins.entries`, збереженого індексу Plugin, записів списків дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо не задано `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Plugin active memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання ідентифікатора Plugin проти npm-специфікації">
    Коли ви передаєте ідентифікатор Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tag, як-от `@beta`, і точні закріплені версії й надалі використовуються під час пізніших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису Plugin, оновлює цей установлений Plugin і записує нову npm-специфікацію для майбутніх оновлень за ідентифікатором.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису Plugin. Використовуйте це, коли Plugin було закріплено на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє версію встановленого пакета відносно метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, повторного встановлення або переписування `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики Plugin `before_install` або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного Plugin. Показує ідентичність, стан завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, служби, методи Gateway, HTTP-маршрути, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен Plugin класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [Формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відтворює таблицю для всього парку з формою, видами можливостей, повідомленнями про сумісність, можливостями пакета та колонками зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення про сумісність. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу компактне зведення форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin є збереженою холодною моделлю читання OpenClaw для ідентичності встановлених Plugin, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` є застарілим аварійним перемикачем сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-варіант призначений лише для аварійного відновлення запуску, поки міграція розгортається.
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
