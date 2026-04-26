---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами з комплектом модулів
    - Ви хочете налагодити збої завантаження плагінів
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-04-26T00:18:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: da98084eb695f0180f928475e31c649a6fc45431b59067688d37417b3727f587
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Керуйте плагінами Gateway, наборами хуків і сумісними пакетами.

Пов’язано:

- Система Plugin: [Плагіни](/uk/tools/plugin)
- Сумісність пакетів: [Пакети плагінів](/uk/plugins/bundles)
- Маніфест Plugin + схема: [Маніфест Plugin](/uk/plugins/manifest)
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

Вбудовані плагіни постачаються разом з OpenClaw. Деякі з них увімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований плагін браузера); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачатися з `openclaw.plugin.json` із вбудованою схемою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні пакети натомість використовують власні маніфести пакетів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип пакета (`codex`, `claude` або `cursor`) і виявлені можливості пакета.

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

Прості назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Примітка щодо безпеки: ставтеся до встановлення плагінів як до запуску коду. Віддавайте перевагу закріпленим версіям.

Якщо ваш розділ `plugins` використовує однофайловий `$include`, то `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і не змінюють `openclaw.json`. Кореневі include, масиви include та include із сусідніми перевизначеннями завершуються без змін замість сплощення. Підтримувані форми див. у [Config includes](/uk/gateway/configuration).

Якщо конфігурація невалідна, `plugins install` зазвичай завершується без змін і пропонує спочатку виконати `openclaw doctor --fix`. Єдиний задокументований виняток — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

`--force` повторно використовує наявну ціль встановлення і перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте його, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm-плагіна віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється і пропонує `plugins update <id-or-npm-spec>` для звичайного оновлення або `plugins install <package> --force`, якщо ви справді хочете перезаписати поточне встановлення з іншого джерела.

`--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace, а не npm-spec.

`--dangerously-force-unsafe-install` — це аварійний параметр для хибнопозитивних спрацьовувань вбудованого сканера небезпечного коду. Він дозволяє продовжити встановлення, навіть якщо вбудований сканер повідомляє про результати `critical`, але **не** обходить блокування політики hook `before_install` плагіна і **не** обходить збої сканування.

Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей Skills, що виконуються через Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills через ClawHub.

`plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Для відфільтрованої видимості хуків і вмикання окремих хуків використовуйте `openclaw hooks`, а не встановлення пакетів.

Npm-spec є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Для безпеки встановлення залежностей виконуються локально для проєкту з `--ignore-scripts`, навіть якщо у вашій оболонці задані глобальні параметри npm install.

Прості специфікації та `@latest` залишаються на стабільному каналі. Якщо npm розв’язує будь-яку з них до prerelease-версії, OpenClaw зупиняється і просить явно погодитися через тег prerelease, наприклад `@beta`/`@rc`, або через точну версію prerelease, наприклад `@1.2.3-beta.4`.

Якщо проста специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін напряму. Щоб встановити npm-пакет з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Також підтримуються встановлення з marketplace Claude.

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також віддає перевагу ClawHub для простих безпечних для npm специфікацій плагінів. До npm він переходить лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє заявлену сумісність API плагіна / мінімальну сумісність gateway, а потім встановлює його звичайним шляхом для архівів. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
- локальний корінь marketplace або шлях `marketplace.json`
- скорочений запис репозиторію GitHub, наприклад `owner/repo`
- URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
- URL git

Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, із віддалених маніфестів.

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- пакети, сумісні з Codex (`.codex-plugin/plugin.json`)
- пакети, сумісні з Claude (`.claude-plugin/plugin.json` або типове компонування компонентів Claude)
- пакети, сумісні з Cursor (`.cursor-plugin/plugin.json`)

Сумісні пакети встановлюються до звичайного кореня плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle Skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / `lspServers`, оголошені в маніфесті, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час роботи.

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Використовуйте `--enabled`, щоб показати лише увімкнені плагіни. Використовуйте `--verbose`, щоб перейти від табличного вигляду до детальних рядків для кожного плагіна з метаданими source/origin/version/activation. Використовуйте `--json` для машиночитного інвентарю та діагностики реєстру.

`plugins list` спочатку читає збережений локальний реєстр плагінів і використовує резервний похідний варіант лише з маніфестів, якщо реєстр відсутній або невалідний. Це корисно для перевірки, чи встановлено плагін, чи ввімкнено його і чи видимий він для планування холодного запуску, але це не є живою перевіркою вже запущеного процесу Gateway під час виконання. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати, що новий код `register(api)` або хуки почнуть виконуватися. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

Для налагодження runtime hooks:

- `openclaw plugins inspect <id> --json` показує зареєстровані хуки та діагностику з проходу перевірки завантаженого модуля.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо service/process, шлях до конфігурації та стан RPC.
- Для невбудованих хуків розмови (`llm_input`, `llm_output`, `agent_end`) потрібно `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає його до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` не підтримується з `--link`, оскільки зв’язані встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` під час встановлень npm, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку незакріпленою.

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не конфігурація користувача. Під час встановлень і оновлень вони записуються в `plugins/installs.json` у активному каталозі стану OpenClaw. Його карта верхнього рівня `installRecords` є довготривалим джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це кеш холодного реєстру, похідний від маніфестів. Файл містить попередження не редагувати його вручну та використовується `openclaw plugins update`, uninstall, diagnostics і холодним реєстром плагінів.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, списку дозволених плагінів і, за потреби, прив’язані записи `plugins.load.paths`.
Для плагінів active memory слот пам’яті скидається до `memory-core`.

Типово uninstall також видаляє каталог встановлення плагіна під коренем плагінів активного state-dir. Використовуйте `--keep-files`, щоб залишити файли на диску.

`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і до відстежуваних встановлень наборів хуків у `hooks.internal.installs`.

Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tag, наприклад `@beta`, і точні закріплені версії надалі також використовуватимуться в наступних запусках `update <id>`.

Для встановлень npm ви також можете передати явну npm-специфікацію пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за id.

Передавання назви npm-пакета без версії або тега також зіставляється з відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений на точній версії, а ви хочете повернути його до типової лінійки випусків реєстру.

Перед живим оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія та ідентичність записаного артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення чи перезапису `openclaw.json`.

Коли існує збережений хеш цілісності і хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` показує очікувані й фактичні хеші та просить підтвердження перед продовженням. Неінтерактивні допоміжні засоби оновлення завершуються без змін, якщо викликач не передасть явну політику продовження.

`--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних результатів вбудованого сканування небезпечного коду під час оновлення плагінів. Він так само не обходить блокування політики `before_install` плагіна або блокування через збої сканування і застосовується лише до оновлень плагінів, а не до оновлень наборів хуків.

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Глибока інтроспекція для одного плагіна. Показує ідентичність, статус завантаження, джерело, зареєстровані можливості, хуки, інструменти, команди, сервіси, методи gateway, HTTP-маршрути, прапорці політик, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP.

Кожен плагін класифікується за тим, що саме він реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише з провайдером)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Докладніше про модель можливостей див. у [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту.

`inspect --all` відображає загальносистемну таблицю зі стовпцями форми, типів можливостей, повідомлень про сумісність, можливостей пакета та зведення хуків.

`info` є псевдонімом для `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення про сумісність. Коли все гаразд, він виводить `No plugin issues detected.`

Для збоїв форми модуля, таких як відсутні експорти `register`/`activate`, перезапустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити в діагностичний вивід стислий підсумок форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та належності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпортування runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний чи застарілий. Використовуйте `--refresh`, щоб перебудувати його на основі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях runtime-активації.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Віддавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску під час розгортання міграції.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список marketplace приймає локальний шлях до marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або URL git. `--json` виводить мітку розв’язаного джерела, а також розібраний маніфест marketplace і записи плагінів.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Спільнотні плагіни](/uk/plugins/community)
