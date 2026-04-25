---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідка CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-25T21:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c8abd8c8faf9fbbe1e586a94d5a84848b03746bff05fdac35ffd47032dda292
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язано:

- Система плагінів: [Плагіни](/uk/tools/plugin)
- Сумісність пакетів: [Пакети плагінів](/uk/plugins/bundles)
- Маніфест плагіна + схема: [Маніфест плагіна](/uk/plugins/manifest)
- Посилення безпеки: [Безпека](/uk/gateway/security)

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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі ввімкнені типово (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний плагін); для інших потрібно виконати `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Вивід verbose list/info також показує підтип пакета (`codex`, `claude` або `cursor`) плюс виявлені можливості пакета.

### Встановлення

```bash
openclaw plugins install <package>                      # спочатку ClawHub, потім npm
openclaw plugins install clawhub:<package>              # лише ClawHub
openclaw plugins install <package> --force              # перезаписати наявне встановлення
openclaw plugins install <package> --pin                # закріпити версію
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # локальний шлях
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (явно)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів так само, як до запуску коду. Надавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` використовує однофайловий `$include`, то `plugins install/update/enable/disable/uninstall` записують зміни безпосередньо до включеного файла і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми override-параметрами завершуються захищеною відмовою замість сплощення. Підтримувані форми описано в [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай завершується захищеною відмовою і пропонує спочатку запустити `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або npm-артефакту. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень із npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm-spec.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть якщо вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики хука `before_install` для плагіна і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills через Gateway використовують відповідний override запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованого перегляду хуків і ввімкнення окремих хуків, а не для встановлення пакета.

Npm-spec є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file-spec і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці є глобальні налаштування встановлення npm.

Прості специфікації та `@latest` лишаються на стабільному каналі. Якщо npm для будь-якого з них повертає prerelease, OpenClaw зупиняється й просить вас явно погодитися на це за допомогою prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб установити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з Claude marketplace.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для простих npm-safe специфікацій плагінів. Він переходить до npm, лише якщо в ClawHub немає такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність plugin API / minimum gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

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

Джерелами marketplace можуть бути:

- назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
- локальний корінь marketplace або шлях до `marketplace.json`
- скорочений запис GitHub repo на кшталт `owner/repo`
- URL GitHub repo на кшталт `https://github.com/owner/repo`
- git URL

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися в межах клонованого repo marketplace. OpenClaw приймає відносні джерела шляхів із цього repo і відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються в звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, Cursor command-skills і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час runtime.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише ввімкнені плагіни. Використовуйте `--verbose`, щоб переключитися з табличного вигляду на рядки з деталями для кожного плагіна, включно з метаданими source/origin/version/activation. Використовуйте `--json` для машинозчитуваного переліку плюс diagnostics реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів із резервним derived-варіантом лише за маніфестом, якщо реєстр відсутній або невалідний. Це корисно для перевірки, чи встановлено плагін, чи ввімкнений він і чи видимий для cold startup planning, але це не live runtime probe уже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/container-розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та diagnostics із проходу inspection після завантаження модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Невбудовані conversation hooks (`llm_input`, `llm_output`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки linked-встановлення повторно використовують вихідний шлях замість копіювання до керованої цілі встановлення.

Використовуйте `--pin` для встановлень із npm, щоб зберегти визначену точну специфікацію (`name@version`) у керованому журналі встановлень плагінів, залишивши типову поведінку незакріпленою.

### Журнал встановлень

Метадані встановлення плагінів — це машинно керований стан, а не користувацька конфігурація. Нові встановлення та оновлення записують їх до `plugins/installs.json` у активному каталозі стану OpenClaw. Файл містить попередження не редагувати його вручну й використовується командами `openclaw plugins update`, uninstall, diagnostics і cold plugin registry.

Застарілі записи `plugins.installs` у `openclaw.json` лишаються читабельними як застарілий резервний механізм сумісності. Коли шляхи install/update/uninstall переписують стан встановлення плагіна, OpenClaw записує файл журналу й видаляє `plugins.installs` зі збереженого payload конфігурації.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, керованого журналу встановлень, allowlist плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно.
Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

Типово uninstall також видаляє каталог встановлення плагіна під коренем плагінів active state-dir. Використовуйте
`--keep-files`, щоб зберегти файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому журналі встановлень і відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, такі як `@beta`, і точні закріплені версії й надалі використовуватимуться в наступних запусках `update <id>`.

Для встановлень із npm ви також можете передати явну npm-spec пакета з dist-tag
або точною версією. OpenClaw зіставляє цю назву пакета назад із записом
відстежуваного плагіна, оновлює цей встановлений плагін і записує нову npm-spec
для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або тега також зіставляється назад із
записом відстежуваного плагіна. Використовуйте це, коли плагін був закріплений
на точній версії і ви хочете повернути його до типової гілки випусків реєстру.

Перед живим оновленням npm OpenClaw перевіряє версію встановленого пакета
відносно метаданих реєстру npm. Якщо встановлена версія та записана
ідентичність артефакту вже відповідають цільовому результату розв’язання,
оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється,
OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда
`openclaw plugins update` друкує очікуваний і фактичний хеші та запитує
підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення
завершуються захищеною відмовою, якщо викликач не задає явну політику продовження.

`--dangerously-force-unsafe-install` також доступний для `plugins update` як
аварійний override для хибнопозитивних спрацьовувань вбудованого сканування
небезпечного коду під час оновлень плагінів. Він, як і раніше, не обходить
блокування політики `before_install` для плагіна або блокування через збої
сканування, і застосовується лише до оновлень плагінів, а не до оновлень
наборів хуків.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, стан
завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди,
сервіси, методи gateway, HTTP-маршрути, прапорці політик, diagnostics,
метадані встановлення, можливості пакета та будь-яку виявлену підтримку MCP
або LSP-сервера.

Кожен плагін класифікується за тим, що саме він фактично реєструє під час runtime:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з provider)
- **hybrid-capability** — кілька типів можливостей (наприклад, text + speech + images)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Докладніше про модель можливостей див. у [Plugin shapes](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і
аудиту.

`inspect --all` виводить загальну таблицю з колонками shape, capability kinds,
compatibility notices, bundle capabilities і hook summary.

`info` — це псевдонім для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, diagnostics
маніфестів/виявлення та повідомлення про сумісність. Коли все чисто, він
виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`,
запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий
підсумок форми експорту в діагностичний вивід.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена модель холодного читання OpenClaw для
ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та
володіння внесками. Звичайний запуск, пошук власника provider, класифікація
налаштування каналів і перелік плагінів можуть читати його без імпорту
runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи існує збережений реєстр,
чи він актуальний, чи застарілий. Використовуйте `--refresh`, щоб перебудувати
його зі сталого журналу встановлень, політики конфігурації та метаданих
маніфесту/пакета. Це шлях відновлення, а не шлях активації під час runtime.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний
перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry
--refresh` або `openclaw doctor --fix`; резервний env-варіант призначений лише
для аварійного відновлення запуску під час розгортання міграції.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях marketplace, шлях до `marketplace.json`,
скорочення GitHub на кшталт `owner/repo`, URL GitHub repo або git URL. `--json`
виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і
записи плагінів.

## Пов’язано

- [Довідка CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Плагіни спільноти](/uk/plugins/community)
